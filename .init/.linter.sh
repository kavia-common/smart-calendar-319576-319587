#!/bin/bash
cd /home/kavia/workspace/code-generation/smart-calendar-319576-319587/calendar_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

