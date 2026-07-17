const cron = require('node-cron');
const User = require('../models/User');
const Preorder = require('../models/Preorder');
const { sendEmail } = require('./emailService');

// Function to generate the HTML for the email
const generatePreorderEmailHTML = (user, preorders, monthName) => {
  if (preorders.length === 0) {
    return `
      <h2>Hello ${user.username},</h2>
      <p>You have no preorders scheduled for fulfillment in ${monthName}.</p>
      <p>Happy collecting!</p>
    `;
  }

  const tableRows = preorders.map(p => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.seller}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.brand}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.model}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">₹${p.price}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">₹${p.paid_amount || 0}</td>
      <td style="padding: 8px; border: 1px solid #ddd; color: ${p.payment_status === 'Pending' ? '#d97706' : '#059669'};">
        ${p.payment_status}
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
      <h2 style="color: #f59e0b;">Monthly Preorder Update</h2>
      <p>Hello <strong>${user.username}</strong>,</p>
      <p>Here is the list of your preorders scheduled to be fulfilled this month (${monthName}):</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f3f4f6; text-align: left;">
            <th style="padding: 8px; border: 1px solid #ddd;">Seller</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Brand</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Model</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Paid</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <p style="margin-top: 20px;">Please ensure your pending payments are cleared for fulfillment!</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Collector's Registry System<br>
        This is an automated message.
      </p>
    </div>
  `;
};

// The cron job runs on the 1st of every month at 00:00 (midnight)
// '0 0 1 * *'
const startMonthlyPreorderCron = () => {
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly preorder notification cron job...');
    
    try {
      // Find all users who have an email address and have not disabled email reminders
      const users = await User.find({ 
        email: { $exists: true, $ne: '' },
        emailRemindersEnabled: { $ne: false } 
      });
      
      if (users.length === 0) {
        console.log('No users with email found.');
        return;
      }
      
      // Get current month details
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0-indexed
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      for (const user of users) {
        // Find preorders for this user that are meant to be fulfilled this month
        const preorders = await Preorder.find({ user: user._id });
        
        // Filter in memory for exact month/year matching based on the ETA string
        const currentMonthPreorders = preorders.filter(p => {
          if (!p.eta) return false;
          const etaDate = new Date(p.eta);
          return (
            etaDate.getFullYear() === currentYear &&
            etaDate.getMonth() === currentMonthIndex &&
            p.payment_status !== 'Completed' // Optionally filter out completed ones, or keep all
          );
        });

        if (currentMonthPreorders.length > 0) {
          const htmlContent = generatePreorderEmailHTML(user, currentMonthPreorders, monthName);
          
          await sendEmail({
            to: user.email,
            subject: `Collector's Registry - Your Preorders for ${monthName}`,
            html: htmlContent
          });
        }
      }
      
      console.log('Monthly preorder notifications processed successfully.');
    } catch (error) {
      console.error('Error in monthly preorder cron job:', error);
    }
  });
  
  console.log('Cron job initialized: Monthly Preorder Notifications (1st of every month at midnight)');
};

module.exports = {
  startMonthlyPreorderCron
};
