// Global settings
Globals = Obj(new
{
    debugOn = true,
    detailedAclDebug = false,
    // Disable ACL during development to avoid 405 on public endpoints
    // Re-enable once proper ACL rules exist in the DB
    aclOn = false,
    isSpa = true,
    port = args[0],
    serverName = "Minimal API Backend",
    frontendPath = args[1],
    dbPath = args[2],
    sessionLifeTimeHours = 2
});

Server.Start();
