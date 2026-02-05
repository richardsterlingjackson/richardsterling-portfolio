import { sql } from "../posts/db";
import { Resend } from "resend";
import type { BlogPost } from "../../src/data/posts";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send emails to all subscribers of a category when a new post is published
 * 
 * Usage: Call this function after publishing a post
 * await sendEmailsToSubscribers(newPost)
 */
export async function sendEmailsToSubscribers(post: BlogPost) {
  try {
    // Check if Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Skipping email sending.");
      return;
    }

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

    console.log(`Sending emails to ${subscribers.length} subscribers for ${post.category}...`);

    // Send email to each subscriber
    const emailPromises = subscribers.map((sub: any) =>
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "posts@yourdomain.com",
        to: sub.email,
        subject: `New post: ${post.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${post.title}</h2>
            <p style="color: #666; font-size: 14px;">
              <strong>${post.category}</strong> • ${post.date}
            </p>
            <p style="color: #555; line-height: 1.6;">
              ${post.excerpt}
            </p>
            <a href="${process.env.VERCEL_URL || "https://shared-experiences.com"}/posts/${post.slug}" 
               style="display: inline-block; background-color: #8b7355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
              Read Full Post
            </a>
            <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              You received this email because you subscribed to "${post.category}" posts.
            </p>
          </div>
        `,
      })
    );

    const results = await Promise.all(emailPromises);
    console.log(`Sent ${results.length} emails for post: ${post.title}`);
    return results;
  } catch (err) {
    console.error("Error sending emails to subscribers:", err);
    throw err;
  }
}

/**
 * Send a welcome email to a new subscriber
 */
export async function sendWelcomeEmail(email: string, category: string) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set. Skipping welcome email.");
      return;
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "posts@yourdomain.com",
      to: email,
      subject: `Welcome to Shared Experiences – ${category}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Shared Experiences!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thanks for subscribing to posts in the <strong>${category}</strong> category. 
            You'll now receive emails whenever a new post is published in this category.
          </p>
          <p style="color: #555; line-height: 1.6;">
            Manage your subscription or explore more on our site:
          </p>
          <a href="${process.env.VERCEL_URL || "https://shared-experiences.com"}" 
             style="display: inline-block; background-color: #8b7355; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Visit Shared Experiences
          </a>
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            © 2025 Shared Experiences. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log(`Welcome email sent to ${email} for category: ${category}`);
    return result;
  } catch (err) {
    console.error("Error sending welcome email:", err);
    throw err;
  }
}
