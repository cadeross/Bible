import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
    try {
        // Initialize Resend inside the handler to avoid build-time errors
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error('RESEND_API_KEY is not configured');
            return NextResponse.json(
                { error: 'Email service not configured' },
                { status: 503 }
            );
        }

        const resend = new Resend(apiKey);

        const body = await request.json();
        const { name, email, message } = body;

        // Simple validation
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'OpenWrit <hello@openwrit.com>';
        const contactEmail = process.env.CONTACT_EMAIL || 'hello@openwrit.com';

        const [contactResponse, autoReplyResponse] = await Promise.all([
            // Email to you
            resend.emails.send({
                from: fromEmail,
                to: [contactEmail],
                subject: `Contact Form: Message from ${name}`,
                replyTo: email,
                text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            }),
            // Auto-reply to user
            resend.emails.send({
                from: fromEmail,
                to: [email],
                subject: `We received your message - OpenWrit`,
                text: `Hi ${name},\n\nThank you for reaching out! We have received your message and will get back to you as soon as possible.\n\nBest,\nThe OpenWrit Team`,
            })
        ]);

        if (contactResponse.error) {
            return NextResponse.json({ error: contactResponse.error }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: contactResponse.data });
    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
