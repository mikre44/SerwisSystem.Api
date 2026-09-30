using System.Collections.Concurrent;
using SerwisSystem.Api.Services;

namespace SerwisSystem.Api.Tests.Infrastructure;

public record SentEmail(string ToEmail, string ToName, string Subject, string HtmlBody);

// Replaces SmtpEmailSender in tests: nothing is sent, every message is kept for assertions.
public class FakeEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<SentEmail> _sentEmails = new();

    public IReadOnlyCollection<SentEmail> SentEmails => _sentEmails;

    public Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        _sentEmails.Enqueue(new SentEmail(toEmail, toName, subject, htmlBody));
        return Task.CompletedTask;
    }
}
