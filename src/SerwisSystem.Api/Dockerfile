# Zobacz https://aka.ms/customizecontainer, aby dowiedzieć się, jak dostosować kontener debugowania i jak program Visual Studio używa tego pliku Dockerfile do kompilowania obrazów w celu szybszego debugowania.

# W zależności od systemu operacyjnego maszyn hostów, które będą kompilować lub uruchamiać kontenery, może być konieczna zmiana obrazu określonego w instrukcji FROM.
# Aby uzyskać więcej informacji, zobacz https://aka.ms/containercompat

# Ten etap jest używany podczas uruchamiania z programu VS w trybie szybkim (domyślnie dla konfiguracji debugowania)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-nanoserver-ltsc2022 AS base
WORKDIR /app
EXPOSE 8080


# Ten etap służy do kompilowania projektu usługi
FROM mcr.microsoft.com/dotnet/sdk:10.0-windowsservercore-ltsc2022 AS build
# Zainstaluj narzędzia Visual Studio Build Tools. Są one wymagane do publikowania drzewa obiektów aplikacji (AOT)
# Uwaga: korzystanie z narzędzi Visual Studio Build Tools wymaga ważnej licencji programu Visual Studio.
RUN curl -SL --output vs_buildtools.exe https://aka.ms/vs/17/release/vs_buildtools.exe
RUN vs_buildtools.exe --installPath C:\BuildTools --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 Microsoft.VisualStudio.Component.Windows10SDK.19041 --quiet --wait --norestart --nocache
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["SerwisSystem.Api.csproj", "."]
RUN dotnet restore "./SerwisSystem.Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "./SerwisSystem.Api.csproj" -c %BUILD_CONFIGURATION% -o /app/build

# Ten etap służy do publikowania projektu usługi do skopiowania do etapu końcowego
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./SerwisSystem.Api.csproj" -c %BUILD_CONFIGURATION% -o /app/publish /p:UseAppHost=true

# Ten etap jest używany w środowisku produkcyjnym lub w przypadku uruchamiania z programu VS w trybie regularnym (domyślnie, gdy nie jest używana konfiguracja debugowania)
FROM mcr.microsoft.com/dotnet/runtime:10.0-nanoserver-ltsc2022 AS final
WORKDIR /app
EXPOSE 8080
COPY --from=publish /app/publish .
ENTRYPOINT ["SerwisSystem.Api.exe"]