pipeline {
    agent any

    environment {
        NODE_VERSION = '18'
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_REGISTRY = 'docker.io/pyroborn'
        IMAGE_NAME = 'pyroborn/user-service'
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_CONFIG = "${WORKSPACE}/.docker"
        GIT_REPO_URL = 'https://github.com/Pyroborn/k8s-argoCD.git'
        GIT_CREDENTIALS_ID = 'github-credentials'
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

        stage('Test') {
            environment {
                NODE_ENV = 'test'
                PORT = '3003'
                DATA_DIR = './data/test'
                JEST_JUNIT_OUTPUT_DIR = 'reports'
                JEST_JUNIT_OUTPUT_NAME = 'junit.xml'
            }
            steps {
                // Create reports directory
                sh 'mkdir -p reports'
                // Run tests with coverage
                sh 'npm run test:coverage'

                // Publish test results and coverage
                junit(testResults: 'reports/junit.xml', allowEmptyResults: true)
                
                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'coverage/lcov-report',
                    reportFiles: 'index.html',
                    reportName: 'Coverage Report'
                ])

                // Archive artifacts
                archiveArtifacts(
                    artifacts: 'reports/**, coverage/**',
                    allowEmptyArchive: true
                )
            }
        }
        
        stage('Build Image') {
            steps {
                script {
                    // Build the Docker image
                    sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest"
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Create directory for Trivy reports
                    sh 'mkdir -p security-reports'
                    
                    // Run Trivy scan but continue even if vulnerabilities are found
                    sh """
                        # Install Trivy if not already installed (only needed first time)
                        if ! command -v trivy &> /dev/null; then
                            echo "Trivy not found, installing..."
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /tmp
                            export PATH=$PATH:/tmp
                        fi
                        
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/html.tpl -o /tmp/html.tpl
                        # Run Trivy scan and output to HTML and JSON reports
                        trivy image --no-progress --exit-code 0 --scanners vuln --format template --template /tmp/html.tpl -o security-reports/trivy-report.html ${IMAGE_NAME}:${BUILD_NUMBER}
                        trivy image --no-progress --exit-code 0 --scanners vuln --format json -o security-reports/trivy-report.json ${IMAGE_NAME}:${BUILD_NUMBER}
                        echo "Security scan completed - results won't fail the build"
                    """
                    
                    // Publish HTML report
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'security-reports',
                        reportFiles: 'trivy-report.html',
                        reportName: 'Trivy Security Scan'
                    ])
                    
                    // Archive security reports
                    archiveArtifacts(
                        artifacts: 'security-reports/**',
                        allowEmptyArchive: true
                    )
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    // Create a dummy docker config (optional on newer Jenkins)
                    sh '''
                        mkdir -p ${DOCKER_CONFIG}
                        echo '{"auths": {"https://index.docker.io/v1/": {}}}' > ${DOCKER_CONFIG}/config.json
                    '''
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKERHUB_PASSWORD', usernameVariable: 'DOCKERHUB_USERNAME')]) {
                        sh '''
                            echo "${DOCKERHUB_PASSWORD}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
                            docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                            docker push ${IMAGE_NAME}:latest
                            docker logout
                        '''
                    }
                }
            }
        }
        
        stage('Update GitOps Repository') {
            steps {
                script {
                    // Create a temporary directory for the git clone
                    sh 'mkdir -p gitops-repo'
                    
                    // Clone the GitOps repository using credentials helper
                    dir('gitops-repo') {
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: '*/main']],
                            extensions: [],
                            userRemoteConfigs: [[
                                url: "${GIT_REPO_URL}",
                                credentialsId: "${GIT_CREDENTIALS_ID}"
                            ]]
                        ])
                        
                        // Configure git user
                        sh """
                            git config user.email "jenkins@example.com"
                            git config user.name "Jenkins CI"
                            
                            # Check if the deployment file exists
                            if [ -f deployments/user-service/deployment.yaml ]; then
                                # Update the image tag in the deployment file
                                sed -i 's|image: ${IMAGE_NAME}:.*|image: ${IMAGE_NAME}:${BUILD_NUMBER}|g' deployments/user-service/deployment.yaml
                                
                                # Commit and push the changes
                                git add deployments/user-service/deployment.yaml
                                git commit -m "Update user-service image to ${BUILD_NUMBER}"
                                
                                # Push using credentials helper (managed by Jenkins)
                                git push origin HEAD:main
                                
                                echo "Successfully updated GitOps repository with new image tag: ${BUILD_NUMBER}"
                            else
                                echo "Deployment file not found at deployments/user-service/deployment.yaml"
                                exit 1
                            fi
                        """
                    }
                }
            }
        }
    }
    post {
        always {
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
