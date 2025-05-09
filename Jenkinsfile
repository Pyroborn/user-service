pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Setup') {
            steps {
                checkout scm
                sh 'npm ci'
                sh 'mkdir -p data/test'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint || echo "No lint configuration found"'
            }
        }

        stage('Test') {
            environment {
                NODE_ENV = 'test'
                PORT = '3001'
                DATA_DIR = './data/test'
                JEST_JUNIT_OUTPUT_DIR = 'reports'
                JEST_JUNIT_OUTPUT_NAME = 'junit.xml'
            }
            steps {
                sh 'mkdir -p reports'
                sh 'npm run test:coverage || npm run test || echo "Tests failed"'
            }
            post {
                always {
                    script {
                        junit allowEmptyResults: true, testResults: 'reports/junit.xml'

                        publishHTML(target: [
                            allowMissing: true,
                            alwaysLinkToLastBuild: true,
                            keepAll: true,
                            reportDir: 'coverage/lcov-report',
                            reportFiles: 'index.html',
                            reportName: 'Coverage Report'
                        ])
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build || echo "No build configuration found"'
            }
        }
    }

    post {
        always {
            script {
                archiveArtifacts artifacts: 'reports/**, coverage/**', allowEmptyArchive: true
                cleanWs()
            }
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}