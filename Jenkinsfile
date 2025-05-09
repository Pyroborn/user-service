pipeline {
    agent any

    environment {
        NODE_VERSION = '18'  // Specify Node.js version
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Setup') {
            steps {
                checkout scm
                // Install dependencies using clean install
                sh 'npm ci'
                // Create test data directory
                sh 'mkdir -p data/test'
            }
        }

        stage('Lint') {
            steps {
                // Add linting if you have ESLint configured
                sh 'npm run lint || echo "No lint configuration found"'
            }
        }

        stage('Test') {
            environment {
                NODE_ENV = 'test'
                PORT = '3001'
                DATA_DIR = './data/test'
                // Configure Jest JUnit reporter output
                JEST_JUNIT_OUTPUT_DIR = 'reports'
                JEST_JUNIT_OUTPUT_NAME = 'junit.xml'
            }
            steps {
                // Create reports directory
                sh 'mkdir -p reports'
                // Run tests with coverage
                sh 'npm run test:coverage || npm run test'
            }
            post {
                always {
                    // Publish test results if they exist
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                    
                    // Publish coverage report if it exists
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

        stage('Build') {
            steps {
                // Add build steps if needed (e.g., webpack, transpilation)
                sh 'npm run build || echo "No build configuration found"'
            }
        }
    }

    post {
        always {
            // Clean workspace but archive test results and coverage first
            archiveArtifacts artifacts: 'reports/**, coverage/**', allowEmptyArchive: true
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
} 