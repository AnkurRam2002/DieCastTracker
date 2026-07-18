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
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${p.seller}</td>
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${p.brand}</td>
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${p.model}</td>
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">₹${p.price}</td>
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">₹${p.paid_amount || 0}</td>
      <td style="padding: 10px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: ${p.payment_status === 'Pending' ? '#d97706' : '#059669'};">
        ${p.payment_status}
      </td>
    </tr>
  `).join('');

  const totalToBePaid = preorders.reduce((sum, p) => {
    const price = Number(p.price) || 0;
    const paid = Number(p.paid_amount) || 0;
    return sum + (price - paid);
  }, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
      <style>
        body, table, td, th, p, h1, h2, h3, div, span, strong {
          font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
      <div style="font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; width: 100%; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; box-sizing: border-box;">
        <h2 style="color: #d97706; border-bottom: 2px solid #fde68a; padding-bottom: 12px; margin-top: 0;">Monthly Preorder Update</h2>
        <p style="font-size: 16px;">Hello <strong style="color: #0f172a;">${user.username}</strong>,</p>
        <p style="font-size: 16px;">Here is the list of your preorders scheduled to be fulfilled this month (${monthName}):</p>
        
        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; margin-top: 24px;">
          <table style="width: 100%; min-width: 500px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Seller</th>
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Brand</th>
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Model</th>
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Price</th>
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Paid</th>
                <th style="padding: 12px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 24px; padding: 16px; background-color: #fffbeb; border-radius: 8px; text-align: right; font-size: 16px; border: 1px solid #fef3c7;">
          <strong>Total Amount Due This Month: </strong> <span style="color: #d97706; font-size: 20px; font-weight: 700;">₹${totalToBePaid}</span>
        </div>
        
        <p style="margin-top: 24px; color: #475569; font-size: 14px;">Please ensure your pending payments are cleared for fulfillment!</p>
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center;">
          Collector's Registry System<br>
          This is an automated message.
        </div>
      </div>
    </body>
    </html>
  `;
};

// The cron job runs daily at 00:00 (midnight)
// '0 0 * * *'
const startMonthlyPreorderCron = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily preorder notification cron job check...');
    
    try {
      // Get current date details
      const now = new Date();
      const currentDay = now.getDate();
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth(); // 0-indexed
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Find all users who have an email address, have not disabled email reminders, and their reminder day is today
      const query = { 
        email: { $exists: true, $ne: '' },
        emailRemindersEnabled: { $ne: false } 
      };

      if (currentDay === 1) {
        query.$or = [{ emailReminderDay: 1 }, { emailReminderDay: { $exists: false } }];
      } else {
        query.emailReminderDay = currentDay;
      }

      const users = await User.find(query);
      
      if (users.length === 0) {
        console.log('No users to notify today.');
        return;
      }

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
