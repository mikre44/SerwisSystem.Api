namespace SerwisSystem.Api.Tests.Infrastructure;

// All integration test classes use [Collection(ApiCollection.Name)]: they share one ApiFactory
// (one database, one in-memory server) and xUnit runs them one after another, not in parallel.
[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "API";
}
