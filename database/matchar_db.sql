-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 13, 2025 at 03:06 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `matchar_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `pickup_location_type` enum('Our Office','Other Location') NOT NULL,
  `dropoff_location_type` enum('Our Office','Other Location') NOT NULL,
  `pickup_location` varchar(255) DEFAULT NULL,
  `dropoff_location` varchar(255) DEFAULT NULL,
  `pickup_date` date NOT NULL,
  `pickup_time` time NOT NULL,
  `dropoff_date` date NOT NULL,
  `dropoff_time` time NOT NULL,
  `status` enum('Pending','Approved','Rejected','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
  `customer_note` text DEFAULT NULL,
  `manager_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `car_id`, `user_id`, `pickup_location_type`, `dropoff_location_type`, `pickup_location`, `dropoff_location`, `pickup_date`, `pickup_time`, `dropoff_date`, `dropoff_time`, `status`, `customer_note`, `manager_note`, `created_at`, `updated_at`) VALUES
(36, 19, 80, 'Our Office', 'Our Office', NULL, NULL, '2025-08-15', '10:00:00', '2025-08-16', '10:00:00', 'Approved', NULL, 'h', '2025-08-12 11:51:41', '2025-08-12 11:54:01'),
(37, 19, 80, 'Our Office', 'Our Office', NULL, NULL, '2025-08-20', '10:00:00', '2025-08-21', '10:00:00', 'Cancelled', NULL, NULL, '2025-08-12 12:13:56', '2025-08-12 15:28:27'),
(38, 19, 80, 'Our Office', 'Our Office', NULL, NULL, '2025-08-28', '10:00:00', '2025-08-31', '10:00:00', 'Approved', NULL, 'z', '2025-08-12 13:21:57', '2025-08-12 15:40:59'),
(41, 19, 80, 'Our Office', 'Our Office', NULL, NULL, '2025-08-20', '10:00:00', '2025-08-21', '10:00:00', 'Rejected', NULL, 'm', '2025-08-12 16:09:50', '2025-08-12 16:10:25');

-- --------------------------------------------------------

--
-- Table structure for table `cars`
--

CREATE TABLE `cars` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `year` int(11) NOT NULL,
  `transmission` varchar(50) NOT NULL,
  `fuel` varchar(50) NOT NULL,
  `seats` int(11) NOT NULL,
  `mileage` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cars`
--

INSERT INTO `cars` (`id`, `name`, `price`, `year`, `transmission`, `fuel`, `seats`, `mileage`, `description`, `image`, `created_at`, `updated_at`) VALUES
(19, '2022 Toyota RAV4', 3333.00, 2022, 'Automatic', 'Petrol', 5, '234567', 'While the 2022 Toyota RAV4 isn\'t the most entertaining compact SUV from a driver\'s standpoint, its practicality and efficiency bolster its value and make it worthy of an Editor\'s Choice award. The entry-level model is affordable but very basic, but mid-range trims offer plenty of features that buyers in this segment will appreciate. A 2.5-liter four-cylinder is standard as is an eight-speed automatic and front-wheel drive. All-wheel drive is available, but you won’t see even the most rugged model in the RAV4 lineup sidling up to a 4Runner or a Tacoma at the trailhead. Toyota bundles a host of standard driver-assistance features into the RAV4, including adaptive cruise control. Upscale trims come with luxury features such as faux-leather upholstery, heated seats, and a JBL stereo system. Those who want even more efficiency can go with a RAV4 Hybrid, which we review separately', '/uploads/cars/car-1754956680380-476117370.jpg', '2025-08-11 23:58:00', '2025-08-12 12:18:33');

-- --------------------------------------------------------

--
-- Table structure for table `car_gallery`
--

CREATE TABLE `car_gallery` (
  `id` int(11) NOT NULL,
  `car_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `car_gallery`
--

INSERT INTO `car_gallery` (`id`, `car_id`, `image_path`, `created_at`) VALUES
(206, 19, '/uploads/cars/car-1754956680417-667989341.jpg', '2025-08-12 12:21:26'),
(207, 19, '/uploads/cars/car-1754956680418-812021388.jpg', '2025-08-12 12:21:26'),
(208, 19, '/uploads/cars/car-1754956680421-77605661.jpg', '2025-08-12 12:21:26'),
(209, 19, '/uploads/cars/car-1754956680424-90149497.jpg', '2025-08-12 12:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `participant_a` bigint(20) UNSIGNED NOT NULL,
  `participant_b` bigint(20) UNSIGNED NOT NULL,
  `last_message_id` bigint(20) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_conversations`
--

INSERT INTO `chat_conversations` (`id`, `participant_a`, `participant_b`, `last_message_id`, `updated_at`) VALUES
(20, 78, 80, NULL, '2025-08-10 18:28:53'),
(21, 80, 82, NULL, '2025-08-12 21:07:39');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `sender_id` bigint(20) UNSIGNED NOT NULL,
  `receiver_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('text','image') DEFAULT 'text',
  `content` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_documents`
--

CREATE TABLE `form_documents` (
  `id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `document_type` enum('ghana_card_front','ghana_card_back','license_front','license_back','other') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `fullName` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `role` varchar(50) NOT NULL,
  `avatar` varchar(255) DEFAULT '/images/avatar/default.jpg',
  `is_visible` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `fullName`, `email`, `phone`, `role`, `avatar`, `is_visible`, `created_at`, `updated_at`) VALUES
(21, 'Patrick Dwamena', 'pd855000@gmail.com', '0543877778', 'Manager', '/uploads/staff/staff-1754956808333-180811684.jpg', 1, '2025-08-09 19:49:20', '2025-08-12 00:00:08');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT '/images/avatar/default.jpg',
  `last_seen` datetime DEFAULT NULL,
  `role` enum('admin','manager','customer') DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `address` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `password`, `avatar`, `last_seen`, `role`, `created_at`, `updated_at`, `address`, `dob`, `reset_token`, `reset_token_expiry`) VALUES
(78, 'Jerry', 'John', 'jjrichardson22200400@gmail.com', '0544531430', '66f6fd4e6e42aa877bd38d672a913a841221b21d6d5062f33bd09f17b9f30ab1', '/uploads/avatars/avatar-1754997791213-375621094.jpg', NULL, 'admin', '2025-08-10 12:31:54', '2025-08-12 11:23:11', NULL, NULL, NULL, NULL),
(80, 'Patrick', 'Dwamena', 'pd855000@gmail.com', '+233543877778', '3d0cf44504feb54214770b5bdacafaf31b56f19ec18ffe04d927fab326560091', '/uploads/avatars/avatar-1754956736758-430377414.jpg', NULL, 'admin', '2025-08-10 18:20:16', '2025-08-12 15:38:55', 'Dansoman High Street', '2025-08-10', NULL, NULL),
(82, 'COMFORT', 'DENKYI', 'comfortdenkyi855@gmail.com', '+233543877778', 'fbf95274d933e9ef3ec5cf2c1c3ddabfaf362a9e289c3c717f5b68189e70d770', '/uploads/avatars/avatar-1755013006142-644756545.jpg', NULL, 'customer', '2025-08-12 15:36:46', '2025-08-12 15:36:46', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `verification_forms`
--

CREATE TABLE `verification_forms` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ghana_card_number` varchar(50) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `booking_reason` text DEFAULT NULL,
  `emergency_name` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(20) DEFAULT NULL,
  `ghana_card_front` varchar(255) NOT NULL,
  `ghana_card_back` varchar(255) NOT NULL,
  `license_front` varchar(255) NOT NULL,
  `license_back` varchar(255) NOT NULL,
  `other_documents` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `admin_notes` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `car_id` (`car_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `cars`
--
ALTER TABLE `cars`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `car_gallery`
--
ALTER TABLE `car_gallery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `car_id` (`car_id`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_participants` (`participant_a`,`participant_b`),
  ADD KEY `idx_participant_a` (`participant_a`),
  ADD KEY `idx_participant_b` (`participant_b`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`conversation_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_receiver` (`receiver_id`);

--
-- Indexes for table `form_documents`
--
ALTER TABLE `form_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `form_id` (`form_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `verification_forms`
--
ALTER TABLE `verification_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `cars`
--
ALTER TABLE `cars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `car_gallery`
--
ALTER TABLE `car_gallery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `form_documents`
--
ALTER TABLE `form_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT for table `verification_forms`
--
ALTER TABLE `verification_forms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `car_gallery`
--
ALTER TABLE `car_gallery`
  ADD CONSTRAINT `car_gallery_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_documents`
--
ALTER TABLE `form_documents`
  ADD CONSTRAINT `form_documents_ibfk_1` FOREIGN KEY (`form_id`) REFERENCES `verification_forms` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `verification_forms`
--
ALTER TABLE `verification_forms`
  ADD CONSTRAINT `verification_forms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
