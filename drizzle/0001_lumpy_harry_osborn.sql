CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`treatmentType` enum('Flexível','PPR','Prótese Total','Implante','Limpeza','Clareamento','Restauração','Outro') NOT NULL,
	`treatmentValue` int NOT NULL,
	`contactDate` timestamp NOT NULL,
	`appointmentDate` timestamp,
	`attended` boolean DEFAULT false,
	`treatmentClosed` boolean DEFAULT false,
	`status` enum('A Confirmar','Agendado','Compareceu','Fechou','Sem Interesse') NOT NULL DEFAULT 'A Confirmar',
	`observations` text,
	`origin` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('appointment_reminder','follow_up','custom') NOT NULL,
	`sent` boolean DEFAULT false,
	`sentAt` timestamp,
	`title` varchar(255) NOT NULL,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`scheduledFor` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
