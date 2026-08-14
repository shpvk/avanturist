param(
    [Parameter(Mandatory = $true)]
    [string]$Converter
)

$ErrorActionPreference = "Stop"

$converterPath = (Resolve-Path -LiteralPath $Converter).Path
$frontendRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $frontendRoot "model-sources\heroes"
$runtimeRoot = Join-Path $frontendRoot "public\assets\heroes\models"
$converterTemp = Join-Path $frontendRoot ".cache\fbx2gltf-temp"
$heroes = @(
    "antimage",
    "leshrac",
    "phantom_assassin",
    "pudge",
    "shadow_shaman"
)

New-Item -ItemType Directory -Force -Path $converterTemp | Out-Null

foreach ($hero in $heroes) {
    $heroSource = Join-Path $sourceRoot $hero
    $sourceModel = Join-Path $heroSource "model.fbx"
    $heroRuntime = Join-Path $runtimeRoot $hero
    $runtimeModelWithoutExtension = Join-Path $heroRuntime "model"

    if (-not (Test-Path -LiteralPath $sourceModel)) {
        throw "Missing FBX source for '$hero': $sourceModel"
    }

    New-Item -ItemType Directory -Force -Path $heroRuntime | Out-Null
    Push-Location -LiteralPath $heroSource
    try {
        & $converterPath `
            --binary `
            --skinning-weights 4 `
            --compute-normals broken `
            --fbx-temp-dir $converterTemp `
            --input "model.fbx" `
            --output $runtimeModelWithoutExtension

        if ($LASTEXITCODE -ne 0) {
            throw "FBX2glTF failed for '$hero' with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }

    $runtimeModel = "$runtimeModelWithoutExtension.glb"
    if (-not (Test-Path -LiteralPath $runtimeModel)) {
        throw "Converter did not create '$runtimeModel'"
    }

    $size = (Get-Item -LiteralPath $runtimeModel).Length / 1MB
    Write-Output ("{0}: {1:N2} MB" -f $hero, $size)
}
