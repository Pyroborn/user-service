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
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }

    stages {
        stage('Setup') {
            steps {
                // Clean workspace
                cleanWs()
                // Checkout code
                checkout scm
                // Install dependencies
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
        
        stage('SonarCloud Analysis') {
            steps {
                script {
                    // Check Java version and install compatible SonarScanner
                    sh '''
                    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
                            export PATH=$JAVA_HOME/bin:$PATH

                        echo "Using Java:"
                        java -version
                        
                        if ! command -v sonar-scanner &> /dev/null; then
                            echo "Installing SonarScanner 5.0.1 compatible with Java 17..."
                            wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip
                            unzip -q sonar-scanner-cli-5.0.1.3006-linux.zip
                            mv sonar-scanner-5.0.1.3006-linux sonar-scanner
                            chmod +x sonar-scanner/bin/sonar-scanner
                            echo "SonarScanner 5.0.1 installed successfully"
                        fi
                    '''

                    // Run SonarCloud analysis
                    withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            

                            export PATH=$PATH:$(pwd)/sonar-scanner/bin
                            
                            echo "Starting SonarCloud analysis..."
                            echo "Project Key: Pyroborn_user-service"
                            echo "Organization: pyroborn"
                            
                            sonar-scanner \
                                -Dsonar.projectKey=Pyroborn_user-service \
                                -Dsonar.organization=pyroborn \
                                -Dsonar.host.url=https://sonarcloud.io \
                                -Dsonar.login=${SONAR_TOKEN} \
                                -Dsonar.sources=. \
                                -Dsonar.tests=. \
                                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                                -Dsonar.coverage.exclusions="**/*.test.js,**/tests/**,**/node_modules/**,**/coverage/**,**/data/**" \
                                -Dsonar.cpd.exclusions="**/*.test.js,**/tests/**,**/node_modules/**" \
                                -Dsonar.exclusions="**/node_modules/**,**/coverage/**,**/data/**,**/*.min.js" \
                                -Dsonar.projectVersion=${BUILD_NUMBER} \
                                -Dsonar.buildString=${BUILD_NUMBER} \
                                -Dsonar.qualitygate.wait=true
                        '''
                    }
                }
            }
            post {
                always {
                    // Archive SonarCloud reports if they exist
                    script {
                        if (fileExists('.scannerwork/report-task.txt')) {
                            archiveArtifacts artifacts: '.scannerwork/report-task.txt', allowEmptyArchive: true
                        }
                    }
                }
                failure {
                    echo 'SonarCloud analysis failed!'
                }
                success {
                    echo 'SonarCloud analysis completed successfully!'
                }
            }
        }
        
        stage('Build Image') {
            steps {
                script {
                    // Build Docker image
                    sh "docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} ."
                    sh "docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest"
                }
            }
        }
        
        stage('Trivy Container Security Scan') {
        steps {
            script {
            def imageName = "${IMAGE_NAME}:${BUILD_NUMBER}"
            sh 'mkdir -p security-reports'

            // Download the official Trivy HTML template
            sh '''
                curl -fSL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/html.tpl \
                -o /tmp/html.tpl
            '''

            // Run Trivy scans using the downloaded html.tpl and JSON output format
            sh """
                trivy image --no-progress --exit-code 0 --scanners vuln \
                --format template --template "@/tmp/html.tpl" \
                -o security-reports/trivy-report.html ${imageName}

                trivy image --no-progress --exit-code 0 --scanners vuln \
                --format json \
                -o security-reports/trivy-report.json ${imageName}

                echo "Security scan completed - results won't fail the build"
            """

            // Publish and archive reports
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'security-reports',
                reportFiles: 'trivy-report.html',
                reportName: 'Trivy Security Scan'
            ])
            archiveArtifacts artifacts: 'security-reports/**', allowEmptyArchive: true
            }
        }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    // Create docker config
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
                    // Create GitOps repo directory
                    sh 'rm -rf gitops-repo && mkdir -p gitops-repo'
                    
                    // Clone repository
                    dir('gitops-repo') {
                        checkout([
                            $class: 'GitSCM',
                            branches: [[name: '*/main']],
                            extensions: [
                                [$class: 'CleanBeforeCheckout'], 
                                [$class: 'CloneOption', depth: 1, noTags: false, reference: '', shallow: true]
                            ],
                            userRemoteConfigs: [[
                                url: "${GIT_REPO_URL}",
                                credentialsId: "${GIT_CREDENTIALS_ID}"
                            ]]
                        ])
                        
                        // Configure Git for push
                        withCredentials([usernamePassword(
                            credentialsId: "${GIT_CREDENTIALS_ID}",
                            usernameVariable: 'GIT_USERNAME',
                            passwordVariable: 'GIT_PASSWORD'
                        )]) {
                            sh """
                                # Configure Git
                                git config user.email "jenkins@example.com"
                                git config user.name "Jenkins CI"
                                
                                # Verify deployment file access
                                ls -la deployments/ || echo "Deployments directory not found"
                                ls -la deployments/user-service/ || echo "User service directory not found"
                                
                                if [ -f deployments/user-service/deployment.yaml ]; then
                                    echo "Found deployment file. Current content:"
                                    cat deployments/user-service/deployment.yaml
                                    
                                    # Update image tag
                                    echo "Updating image tag to ${IMAGE_NAME}:${BUILD_NUMBER}"
                                    
                                    # Check for container section
                                    if grep -A 5 "name: user-service" deployments/user-service/deployment.yaml | grep -q "image:"; then
                                        echo "Found image line near 'name: user-service', updating it..."
                                        sed -i "s|^\\(        image: ${IMAGE_NAME}:\\).*|\\1${BUILD_NUMBER}|g" deployments/user-service/deployment.yaml
                                    else
                                        echo "WARNING: Could not find image line near 'name: user-service'. Please check the deployment file structure."
                                        sed -i "/^        - name: user-service/ a\\        image: ${IMAGE_NAME}:${BUILD_NUMBER}" deployments/user-service/deployment.yaml
                                    fi
                                    
                                    echo "Updated content:"
                                    cat deployments/user-service/deployment.yaml
                                    
                                    # Check for changes
                                    if git diff --quiet deployments/user-service/deployment.yaml; then
                                        echo "No changes detected in deployment file"
                                    else
                                        echo "Changes detected, committing..."
                                        git add deployments/user-service/deployment.yaml
                                        git commit -m "Update user-service image to ${BUILD_NUMBER}"
                                        
                                        # Set up remote with credentials
                                        git remote set-url origin https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com/Pyroborn/k8s-argoCD.git
                                        
                                        # Push changes
                                        git push origin HEAD:main
                                        echo "Successfully pushed changes to GitOps repository"
                                    fi
                                else
                                    echo "ERROR: Deployment file not found at deployments/user-service/deployment.yaml"
                                    find . -type f -name "*.yaml" | sort
                                    exit 1
                                fi
                            """
                        }
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