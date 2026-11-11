# AWS Foundations

AWS is a collection of cloud services organized by Region and Availability Zone. A sound AWS design starts with boundaries, identity, failure domains, and operating costs—not with choosing a service from a long catalog.

## Account, Region, and Availability Zone

An account is an isolation and billing boundary. A Region is a geographic service area; an Availability Zone is a physically separate location within a Region. Deploying across multiple Zones can improve availability, but only when the application, data, networking, and operations are designed for failure between Zones.

The shared-responsibility model divides work: AWS secures the underlying cloud infrastructure, while the customer secures identities, data, configuration, workloads, and the operating system where applicable.

## IAM first

Use roles and temporary credentials for workloads. Avoid embedding long-lived access keys in source code, images, or shell history. Policies should grant the smallest actions on the smallest resources needed for one task.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::example-bucket/reports/*"
  }]
}
```

Separate human administration from workload roles, require multi-factor authentication for privileged access, and review unused permissions.

## Core service families

| Need | Common starting services | Design question |
|---|---|---|
| Compute | EC2, ECS/Fargate, Lambda | Do you need host control, containers, or event-driven execution? |
| Object storage | S3 | What are the lifecycle, retention, encryption, and access rules? |
| Block storage | EBS | Is the data attached to one compute instance or replicated elsewhere? |
| Relational data | RDS/Aurora | What consistency, SQL, backup, and failover guarantees are required? |
| Key-value/document data | DynamoDB | Can access patterns be designed around partition keys? |
| Networking | VPC, subnets, route tables, security groups | Which traffic is public, private, or cross-account? |

A VPC is not automatically private. Public subnets have a route to an internet gateway; private workloads commonly use NAT or private service endpoints for outbound access. Security groups are stateful instance or interface firewalls; network ACLs are stateless subnet filters.

## Reliability, observability, and cost

Define backups, recovery point objective, recovery time objective, health checks, deployment rollback, and failure alerts before production. Use metrics, logs, traces, and audit events to connect a user-visible failure to a service and resource.

Costs come from more than compute: data transfer, storage, requests, idle load balancers, snapshots, NAT gateways, and managed-service capacity matter. Tag resources, set budgets, review utilization, and choose a Region deliberately.

> **Architecture rule:** start with the workload's data flow and failure modes, then choose the smallest set of managed services that meets the requirement.
