#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "没有找到 npm，请先安装 Node.js 20 或更新版本。"
  read -r -p "按回车关闭…"
  exit 1
fi

npm run dev
result=$?
if [ "$result" -ne 0 ] && [ "$result" -ne 130 ]; then
  read -r -p "启动失败，请查看上面的提示。按回车关闭…"
fi
exit "$result"
