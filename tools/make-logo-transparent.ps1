param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$Width = 900,
  [int]$Height = 600
)

Add-Type -AssemblyName System.Drawing

function Convert-LogoTransparency {
  param([string]$SourcePath, [string]$DestinationPath, [int]$TargetWidth, [int]$TargetHeight)

  $source = [System.Drawing.Bitmap]::new($SourcePath)
  $image = [System.Drawing.Bitmap]::new($TargetWidth, $TargetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($image)
  $graphics.Clear([System.Drawing.Color]::White)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($source, 0, 0, $TargetWidth, $TargetHeight)
  $graphics.Dispose()
  $source.Dispose()

  $rect = [System.Drawing.Rectangle]::new(0, 0, $TargetWidth, $TargetHeight)
  $data = $image.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $stride = $data.Stride
  $pixels = [byte[]]::new($stride * $TargetHeight)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $pixels, 0, $pixels.Length)

  $state = [byte[]]::new($TargetWidth * $TargetHeight)
  $queue = [System.Collections.Generic.Queue[int]]::new()
  for ($x = 0; $x -lt $TargetWidth; $x++) {
    $queue.Enqueue($x)
    $queue.Enqueue(($TargetHeight - 1) * $TargetWidth + $x)
  }
  for ($y = 1; $y -lt $TargetHeight - 1; $y++) {
    $queue.Enqueue($y * $TargetWidth)
    $queue.Enqueue($y * $TargetWidth + $TargetWidth - 1)
  }
  # 虹の内側は外周とつながっていないため、透明領域の種を中央にも置く。
  $queue.Enqueue([Math]::Floor($TargetHeight * 0.32) * $TargetWidth + [Math]::Floor($TargetWidth * 0.5))

  while ($queue.Count -gt 0) {
    $index = $queue.Dequeue()
    if ($state[$index] -ne 0) { continue }
    $x = $index % $TargetWidth
    $y = [Math]::Floor($index / $TargetWidth)
    $offset = $y * $stride + $x * 4
    $blue = [int]$pixels[$offset]
    $green = [int]$pixels[$offset + 1]
    $red = [int]$pixels[$offset + 2]
    $distance = [Math]::Max(255 - $red, [Math]::Max(255 - $green, 255 - $blue))

    # 外周からつながる白系画素だけを背景として扱う。
    if ($distance -gt 110) {
      $state[$index] = 2
      continue
    }

    $state[$index] = 1
    $alpha = if ($distance -le 12) { 0 } else { [Math]::Min(255, [Math]::Floor(($distance - 12) * 255 / 88)) }
    if ($alpha -eq 0) {
      $pixels[$offset] = $pixels[$offset + 1] = $pixels[$offset + 2] = 0
    } else {
      $pixels[$offset] = [byte][Math]::Max(0, [Math]::Min(255, 255 + ($blue - 255) * 255 / $alpha))
      $pixels[$offset + 1] = [byte][Math]::Max(0, [Math]::Min(255, 255 + ($green - 255) * 255 / $alpha))
      $pixels[$offset + 2] = [byte][Math]::Max(0, [Math]::Min(255, 255 + ($red - 255) * 255 / $alpha))
    }
    $pixels[$offset + 3] = [byte]$alpha

    if ($x -gt 0) { $queue.Enqueue($index - 1) }
    if ($x + 1 -lt $TargetWidth) { $queue.Enqueue($index + 1) }
    if ($y -gt 0) { $queue.Enqueue($index - $TargetWidth) }
    if ($y + 1 -lt $TargetHeight) { $queue.Enqueue($index + $TargetWidth) }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($pixels, 0, $data.Scan0, $pixels.Length)
  $image.UnlockBits($data)
  $image.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $image.Dispose()
}

$inputFullPath = [System.IO.Path]::GetFullPath($InputPath)
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($outputFullPath)) | Out-Null
Convert-LogoTransparency -SourcePath $inputFullPath -DestinationPath $outputFullPath -TargetWidth $Width -TargetHeight $Height
