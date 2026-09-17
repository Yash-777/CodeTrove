# Sending email from code

Testing email delivery is easiest when you use a disposable inbox. Two good options are:

- https://temp-mail.org/en/
- https://temp-mail.io/en

These let you create a temporary email address and verify that the message was actually delivered before sending it to a production inbox.

## JavaScript example with Nodemailer

```js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password',
  },
});

const mailOptions = {
  from: '"CodeTrove Demo" <your-email@gmail.com>',
  to: ['demo@temp-mail.org', 'demo@temp-mail.io'],
  subject: 'Welcome to CodeTrove',
  text: 'Hello! This is a test email from CodeTrove.',
  html: '<p>Hello! This is a <strong>test email</strong> from CodeTrove.</p>',
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent successfully:', info.messageId);
} catch (error) {
  console.error('Failed to send email:', error);
}
```

### Notes
- For Gmail, use an App Password instead of your normal account password.
- Replace the sample addresses with the temporary inboxes you created on the links above.
- If your provider blocks SMTP, use your provider's recommended settings instead.

## Java example with JavaMail

```java
import java.util.Properties;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class EmailSender {
    public static void main(String[] args) {
        final String username = "your-email@gmail.com";
        final String password = "your-app-password";

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress("your-email@gmail.com"));
            message.setRecipients(
                Message.RecipientType.TO,
                InternetAddress.parse("demo@temp-mail.org, demo@temp-mail.io")
            );
            message.setSubject("Welcome to CodeTrove");
            message.setText("Hello! This is a test email from CodeTrove.");

            Transport.send(message);
            System.out.println("Email sent successfully.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Java notes
- Add the JavaMail dependency to your project.
- If using Maven, include the `javax.mail` dependency.
- Use the temp-mail inbox addresses only for testing and validation.

## Best practices

1. Use disposable inboxes during development.
2. Keep credentials in environment variables instead of hardcoding them.
3. Never send test email to real users until you confirm the SMTP settings are correct.
4. Log the message ID so you can verify delivery in the email provider's activity view.

## When to use this

Use this approach when:
- you are building a signup email flow
- you want to validate SMTP configuration
- you need a quick sandbox for email testing without exposing private inboxes

## Helpful links

- https://temp-mail.org/en/
- https://temp-mail.io/en
- https://nodemailer.com/
- https://www.oracle.com/java/technologies/javamail.html
