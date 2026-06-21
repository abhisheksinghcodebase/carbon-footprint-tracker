@echo off
echo ==============================================
echo Deploying EcoPulse to Google Cloud Run
echo ==============================================
echo Project: election-project-494506
echo Region: us-central1
echo Service: ecopulse
echo ==============================================

gcloud run deploy ecopulse ^
  --source . ^
  --region us-central1 ^
  --allow-unauthenticated ^
  --project election-project-494506

if %errorlevel% neq 0 (
  echo Deployment failed!
  exit /b %errorlevel%
)

echo Deployment completed successfully!
pause
