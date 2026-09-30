# Build context is this project's own directory:
#   docker build -t serwissystem-api -f Dockerfile .   (run from src/SerwisSystem.Api)

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so dependency layers are cached across code-only changes.
COPY SerwisSystem.Api.csproj ./
RUN dotnet restore SerwisSystem.Api.csproj

# publish also builds the project, so a separate "dotnet build" step is not needed.
COPY . .
RUN dotnet publish SerwisSystem.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

# The .NET images ship a non-root "app" user; do not run the API as root.
USER $APP_UID

ENTRYPOINT ["dotnet", "SerwisSystem.Api.dll"]
