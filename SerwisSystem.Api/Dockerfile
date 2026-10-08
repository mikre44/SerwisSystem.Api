FROM mcr.microsoft.com/dotnet/sdk:10.0-windowsservercore-ltsc2022 AS build
WORKDIR /src
COPY ["SerwisSystem.Api/SerwisSystem.Api.csproj", "."]
RUN dotnet restore "SerwisSystem.Api.csproj"
COPY SerwisSystem.Api/ .
RUN dotnet publish "SerwisSystem.Api.csproj" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-nanoserver-ltsc2022 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SerwisSystem.Api.dll"]
