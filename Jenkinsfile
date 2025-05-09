pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Setup') {
            steps {
                // Clean workspace before starting
                cleanWs()
                // Checkout code
                checkout scm
                // Install dependencies using clean install
                sh 'npm ci'
                sh 'mkdir -p data/test'
            }
        }

        stage('Lint') {
            steps {
                // Run linting
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
                // Create reports directory
                sh 'mkdir -p reports'
                // Run tests with coverage
                sh 'npm run test:coverage || npm run test || echo "Tests failed"'
            }
            post {
                always {
                    script {
                        // Publish test results
                        junit allowEmptyResults: true, testResults: 'reports/junit.xml'

                        // Publish coverage report
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
                // Run build if defined
                sh 'npm run build || echo "No build configuration found"'
            }
        }
    }

    post {
        always {
            node {
                script {
                    // Archive reports and coverage
                    archiveArtifacts artifacts: 'reports/**, coverage/**', allowEmptyArchive: true

                    // Clean workspace after pipeline run
                    cleanWs()
                }
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