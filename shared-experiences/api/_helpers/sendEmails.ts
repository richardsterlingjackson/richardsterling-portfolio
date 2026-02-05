import { sql } from "@neondatabase/serverless";
import type { BlogPost } from "@/data/posts";

/**
 * Send emails to all subscribers of a category when a new post is published
 * 
 * This requires configuring an email service like SendGrid, Mailgun, or Resend
 * For now, this logs subscribers and shows how to integrate an email service
 * 
 * Usage: Call this function after publishing a post
 * await sendEmailsToSubscribers(newPost)
 */
export async function sendEmailsToSubscribers(post: BlogPost) {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log("DATABASE_URL not set. Skipping email sending.");
      return;
    }

    // Get all subscribers for this category
    const subscribers = await sql`
      SELECT email, category FROM subscribers 
      WHERE category = ${post.category} AND created_at IS NOT NULL
    `;

    if (subscribers.length === 0) {
      console.log(`No subscribers for category: ${post.category}`);
      return;
    }

    console.log(`Found ${subscribers.length} subscribers for ${post.category}. Ready to send emails.`);

    // TODO: Integrate with email service
    // Uncomment one of these options:
    
    // OPTION 1: Resend (recommended, works great with Vercel)
    // const { Resend } = require('resend');
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // 
    // const emailPromises = subscribers.map((sub: any) =>
    //   resend.emails.send({
    //     from: 'posts@yourdomain.com',
    //     to: sub.email,
    //     subject: `New post: ${post.title}`,
    //     html: `
    //       <h2>${post.title}</h2>
    //       <p>${post.excerpt}</p>
    //       <a href="${process.env.VERCEL_URL}/posts/${post.slug}">Read More</a>
    //     `,
    //   })
    // );
    // await Promise.all(emailPromises);

    // OPTION 2: SendGrid
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const emailPromises = subscribers.map((sub: any) =>
    //   sgMail.send({
    //     to: sub.email,
    //     from: process.env.SENDGRID_FROM_EMAIL,
    //     subject: `New post: ${post.title}`,
    //     html: `...`,
    //   })
    // );
    // await Promise.all(emailPromises);

    // OPTION 3: Mailgun
    // const mailgun = require('mailgun.js');
    // const FormData = require('form-data');
    // const client = new mailgun(FormData);
    // const domain = process.env.MAILGUN_DOMAIN;
    // 
    // const emailPromises = subscribers.map((sub: any) =>
    //   client.messages.create(domain, {
    //     from: `noreply@${domain}`,
    //     to: sub.email,
    //     subject: `New post: ${post.title}`,
    //     html: `...`,
    //   })
    // );
    // await Promise.all(emailPromises);

    console.log(`Email service not configured. Set up one of: RESEND_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY`);
  } catch (err) {
    console.error("Error sending emails to subscribers:", err);
  }
}
