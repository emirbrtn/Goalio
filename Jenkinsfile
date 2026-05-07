pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  environment {
    COMPOSE_PROJECT_NAME = 'goalio-ci'
    COMPOSE_FILES = '-f docker-compose.yml -f docker-compose.ci.yml'
    MONGODB_PORT = '37017'
    BACKEND_PORT = '35000'
    FRONTEND_PORT = '33000'
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
        sh 'docker compose ${COMPOSE_FILES} down -v --remove-orphans || true'
        sh 'docker compose ${COMPOSE_FILES} build'
        sh 'docker compose ${COMPOSE_FILES} up -d'
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
      sh 'docker compose ${COMPOSE_FILES} ps || true'
      sh 'docker compose ${COMPOSE_FILES} logs --no-color > ci/compose.log || true'
      archiveArtifacts artifacts: 'ci/compose.log', onlyIfSuccessful: false
      sh 'docker compose ${COMPOSE_FILES} down -v --remove-orphans || true'
    }
  }
}
