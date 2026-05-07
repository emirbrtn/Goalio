pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  environment {
    COMPOSE_PROJECT_NAME = 'goalio-ci'
  }

  stages {
    stage('Checkout SCM') {
      steps {
        checkout scm
      }
    }

    stage('Checkout') {
      steps {
        sh 'chmod +x ci/*.sh'
        sh './ci/generate-backend-env.sh'
      }
    }

    stage('Build and Deploy') {
      steps {
        sh 'docker compose down -v --remove-orphans || true'
        sh 'docker compose build'
        sh 'docker compose up -d'
      }
    }

    stage('Health Check') {
      steps {
        sh './ci/smoke-test.sh'
      }
    }

    stage('Post Actions') {
      steps {
        sh 'echo "Deploy basarili: goalio calisiyor."'
      }
    }
  }

  post {
    always {
      sh 'docker compose ps || true'
      sh 'docker compose logs --no-color > ci/compose.log || true'
      archiveArtifacts artifacts: 'ci/compose.log', onlyIfSuccessful: false
      sh 'docker compose down -v --remove-orphans || true'
    }
  }
}
