using MigraDoc.DocumentObjectModel;
using MigraDoc.Rendering;
using PdfSharp.Fonts;
using SerwisSystem.Api.Models;
using SerwisSystem.Api.Models.Enums;

namespace SerwisSystem.Api.Services;

public class RepairPdfService
{
    static RepairPdfService()
    {
        GlobalFontSettings.FontResolver = new RepairPdfFontResolver();
    }

    public byte[] CreatePdf(Repair repair)
    {
        var document = new Document();
        document.Info.Title = $"Karta naprawy nr {repair.Id}";
        var normal = document.Styles[StyleNames.Normal]!;
        normal.Font.Name = "Noto Sans";
        normal.Font.Size = 10;
        normal.ParagraphFormat.SpaceAfter = Unit.FromPoint(6);

        var page = document.AddSection();
        page.PageSetup.PageFormat = PageFormat.A4;
        page.PageSetup.TopMargin = page.PageSetup.BottomMargin = Unit.FromCentimeter(2);
        page.PageSetup.LeftMargin = page.PageSetup.RightMargin = Unit.FromCentimeter(2);
        var title = page.AddParagraph($"Karta naprawy nr {repair.Id}");
        title.Format.Font.Size = 18;
        title.Format.SpaceAfter = Unit.FromPoint(16);
        var status = repair.Status switch
        {
            RepairStatus.Pending => "Oczekująca",
            RepairStatus.InProgress => "W trakcie",
            RepairStatus.Completed => "Zakończona",
            RepairStatus.Cancelled => "Anulowana",
            _ => "Nieznany status"
        };
        void Add(string label, string? value) => page.AddParagraph($"{label}: {(string.IsNullOrWhiteSpace(value) ? "Brak" : value)}");
        Add("Status", status);
        Add("Sposób realizacji", RepairMethodLabels.GetLabel(repair.RepairMethod));
        Add("Data zgłoszenia (UTC)", repair.CreatedAt.ToString("dd.MM.yyyy HH:mm"));
        Add("Produkt", repair.Product);
        Add("Numer seryjny", repair.SerialNumber);
        Add("Opis problemu", repair.Description);
        Add("Osoba kontaktowa", $"{repair.ReporterName} {repair.ReporterSurname}");
        Add("Telefon", repair.ReporterPhone);
        Add("E-mail", repair.ReporterEmail);
        Add("Firma", repair.CompanyName);
        Add("Adres", $"{repair.CompanyAddress}, {repair.CompanyPostalCode} {repair.CompanyCity}");
        Add("NIP", repair.CompanyNip);
        Add("Naprawa gwarancyjna", repair.HasWarranty ? "Tak" : "Nie");
        if (repair.HasWarranty)
        {
            Add("Data zakupu", repair.PurchaseDate?.ToString("dd.MM.yyyy"));
            Add("Numer faktury", repair.PurchaseInvoiceNumber);
        }
        Add("Umowa serwisowa", repair.HasContract ? repair.ContractNumber : "Nie");
        Add("Pracownik", repair.User?.Username);
        var footer = page.Footers.Primary.AddParagraph("Strona ");
        footer.AddPageField();
        footer.AddText(" z ");
        footer.AddNumPagesField();
        footer.Format.Alignment = ParagraphAlignment.Right;

        var renderer = new PdfDocumentRenderer { Document = document };
        renderer.RenderDocument();
        using var stream = new MemoryStream();
        renderer.PdfDocument.Save(stream, false);
        return stream.ToArray();
    }
}

internal sealed class RepairPdfFontResolver : IFontResolver
{
    public FontResolverInfo ResolveTypeface(string familyName, bool bold, bool italic)
        => new("NotoSans", bold, italic);

    public byte[] GetFont(string faceName)
    {
        using var font = typeof(RepairPdfService).Assembly.GetManifestResourceStream(
            "SerwisSystem.Api.Fonts.NotoSans-Regular.ttf")!;
        using var stream = new MemoryStream();
        font.CopyTo(stream);
        return stream.ToArray();
    }
}
