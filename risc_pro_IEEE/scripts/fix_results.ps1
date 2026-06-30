$path = 'C:\Users\Shaiju\Downloads\risc_pro_final (3)\risc_pro_final\risc_pro_final\risc_pro\templates\results.html'
$s = Get-Content -Raw -LiteralPath $path
$old = ' </div> </div> class="result-card" id="pipeline-table-container" style="display:none;"'
$new = ' </div> </div> <div class="result-card" id="pipeline-table-container" style="display:none;"'
$s = $s.Replace($old, $new)
Set-Content -LiteralPath $path -Value $s -Force
Write-Output 'replaced'