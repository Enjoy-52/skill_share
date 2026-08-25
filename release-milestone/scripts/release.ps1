# EnjoyTyping release milestone: commit, push, releases/vX branch, tag, back to dev.
param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [string]$RepoRoot = "",
    [string]$BaseBranch = "dev",
    [string]$CommitMessage = "",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Normalize-Version([string]$v) {
    $v = $v.Trim()
    if ($v -match '^[vV]') { return "v" + $v.Substring(1) }
    return "v$v"
}

function Find-GitRoot([string]$start) {
    $dir = Resolve-Path $start
    while ($dir) {
        if (Test-Path (Join-Path $dir ".git")) { return $dir.Path }
        $parent = Split-Path $dir.Path -Parent
        if (-not $parent -or $parent -eq $dir.Path) { break }
        $dir = Get-Item $parent
    }
    return $null
}

function Invoke-Git {
    param([string[]]$Args)
    $line = "git " + ($Args -join " ")
    if ($DryRun) {
        Write-Host "[dry-run] $line"
        return
    }
    & git @Args
    if ($LASTEXITCODE -ne 0) { throw "git failed: $line" }
}

$ver = Normalize-Version $Version
$releaseBranch = "releases/$ver"

if (-not $RepoRoot) {
    $RepoRoot = Find-GitRoot (Get-Location)
    if (-not $RepoRoot) { throw "Not a git repository. Pass -RepoRoot." }
}
Set-Location $RepoRoot
Write-Host "Repo: $RepoRoot"
Write-Host "Version: $ver | Release branch: $releaseBranch | Base: $BaseBranch"

Invoke-Git @("rev-parse", "--git-dir") | Out-Null

$status = & git status --porcelain
if ($LASTEXITCODE -ne 0) { throw "git status failed" }

$current = (& git branch --show-current).Trim()
if ($current -ne $BaseBranch) {
    Write-Host "Checking out $BaseBranch (was on $current)"
    Invoke-Git @("checkout", $BaseBranch)
}

if (-not $DryRun) {
    & git pull origin $BaseBranch 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "warn: git pull origin $BaseBranch failed or no upstream" }
}

if ($status) {
    if (-not $CommitMessage) {
        $CommitMessage = "chore(release): milestone $ver"
    }
    Write-Host "Committing changes..."
    Invoke-Git @("add", "-A")
    Invoke-Git @("commit", "-m", $CommitMessage)
} else {
    Write-Host "Working tree clean, skip commit."
}

Write-Host "Pushing $BaseBranch..."
Invoke-Git @("push", "origin", $BaseBranch)

& git show-ref --verify --quiet "refs/heads/$releaseBranch" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Branch $releaseBranch exists, checking out."
    Invoke-Git @("checkout", $releaseBranch)
    Invoke-Git @("merge", $BaseBranch, "--no-edit")
} else {
    Write-Host "Creating $releaseBranch from $BaseBranch..."
    Invoke-Git @("checkout", "-b", $releaseBranch)
}

Invoke-Git @("push", "-u", "origin", $releaseBranch)

& git rev-parse "$ver" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $ver already exists, skip tag create."
} else {
    Invoke-Git @("tag", "-a", $ver, "-m", "Release $ver")
}
Invoke-Git @("push", "origin", $ver)

Write-Host "Back to $BaseBranch..."
Invoke-Git @("checkout", $BaseBranch)

Write-Host ""
Write-Host "Done."
Write-Host "  Branch: $releaseBranch (pushed)"
Write-Host "  Tag:    $ver (pushed)"
Write-Host "  Current: $BaseBranch"
