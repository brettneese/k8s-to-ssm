# k8s-to-ssm

A simple CLI tool to upload K8S secrets to AWS SSM

`k8sssm ${ssm_path} ${json/yaml data}`

1. `npm install -g k8s-to-ssm`
2. Examples:

`kubectl get --export secrets -o json | k8s2ssm /ssmpath -`
`cat secrets.yaml | ./index.js k8s2ssm /ssmpath -`
