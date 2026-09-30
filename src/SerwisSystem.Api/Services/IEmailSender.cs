namespace SerwisSystem.Api.Services;

// Delivers an already written email. EmailService decides what the message says;
// the sender only knows how to deliver it. Tests replace it with a fake that records
// the messages, so no test ever talks to a real mail server.
public interface IEmailSender
{
    Task SendAsync(string toEmail, string toName, string subject, string htmlBody);
}
