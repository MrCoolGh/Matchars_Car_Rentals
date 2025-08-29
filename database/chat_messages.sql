-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 08, 2025 at 09:38 PM
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

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `conversation_id`, `sender_id`, `receiver_id`, `type`, `content`, `image_url`, `created_at`, `read_at`) VALUES
(1, 1, 55, 58, 'text', 'hello', NULL, '2025-08-08 15:37:18', NULL),
(2, 1, 55, 58, 'text', 'How are you doing', NULL, '2025-08-08 15:37:23', NULL),
(3, 2, 55, 57, 'text', 'hi', NULL, '2025-08-08 15:37:52', NULL),
(4, 3, 55, 56, 'text', 'hi]', NULL, '2025-08-08 15:37:56', '2025-08-08 16:11:49'),
(5, 4, 55, 55, 'text', 'hi', NULL, '2025-08-08 15:38:01', '2025-08-08 16:10:54'),
(6, 3, 56, 55, 'text', 'Hello man', NULL, '2025-08-08 15:40:13', '2025-08-08 16:10:52'),
(7, 3, 56, 55, 'text', 'How are you', NULL, '2025-08-08 15:40:17', '2025-08-08 16:10:52'),
(8, 3, 56, 55, 'text', 'I’m good', NULL, '2025-08-08 15:40:35', '2025-08-08 16:10:52'),
(9, 3, 56, 55, 'text', 'Where are you ???', NULL, '2025-08-08 15:40:40', '2025-08-08 16:10:52'),
(10, 3, 56, 55, 'text', 'Check', NULL, '2025-08-08 15:41:05', '2025-08-08 16:10:52'),
(11, 3, 55, 56, 'text', 'okay okay', NULL, '2025-08-08 15:42:03', '2025-08-08 16:11:49'),
(12, 3, 55, 56, 'text', 'are y9o here', NULL, '2025-08-08 15:42:08', '2025-08-08 16:11:49'),
(13, 3, 56, 55, 'text', 'Hello', NULL, '2025-08-08 16:11:27', '2025-08-08 16:11:34'),
(14, 3, 55, 56, 'text', 'Hi how are you', NULL, '2025-08-08 16:11:40', '2025-08-08 16:11:49'),
(15, 3, 55, 56, 'image', '', '/uploads/chat/chat-1754669732033-628421823.jpg', '2025-08-08 16:15:32', '2025-08-08 16:16:04'),
(16, 3, 55, 56, 'text', 'hello', NULL, '2025-08-08 16:30:45', '2025-08-08 16:31:46'),
(17, 3, 55, 56, 'text', 'how are yu', NULL, '2025-08-08 16:30:55', '2025-08-08 16:31:46'),
(18, 3, 56, 55, 'text', 'I’m okay but you ?', NULL, '2025-08-08 16:32:01', '2025-08-08 16:33:50'),
(19, 2, 55, 57, 'text', 'hello', NULL, '2025-08-08 16:52:14', NULL),
(20, 2, 55, 57, 'image', '', '/uploads/chat/chat-1754671941280-706112225.jpg', '2025-08-08 16:52:21', NULL),
(21, 5, 56, 58, 'text', 'Hello how are you', NULL, '2025-08-08 16:53:02', NULL),
(22, 1, 55, 58, 'text', 'hello', NULL, '2025-08-08 17:14:27', NULL),
(23, 1, 55, 58, 'text', 'How are you doing', NULL, '2025-08-08 17:14:34', NULL),
(24, 3, 55, 56, 'text', 'how are you', NULL, '2025-08-08 17:14:44', '2025-08-08 17:15:15'),
(25, 3, 55, 56, 'text', 'hello', NULL, '2025-08-08 17:15:10', '2025-08-08 17:15:15'),
(26, 3, 56, 55, 'image', '', '/uploads/chat/chat-1754673334006-465070375.jpeg', '2025-08-08 17:15:34', '2025-08-08 17:15:44'),
(27, 1, 55, 58, 'text', 'hello', NULL, '2025-08-08 17:32:36', NULL),
(28, 1, 55, 58, 'text', 'how are you ?', NULL, '2025-08-08 17:32:42', NULL),
(29, 8, 55, 59, 'text', 'Hello', NULL, '2025-08-08 17:32:56', NULL),
(30, 4, 55, 55, 'text', 'hi', NULL, '2025-08-08 18:33:15', '2025-08-08 18:33:30'),
(31, 3, 56, 55, 'text', 'Hello bro', NULL, '2025-08-08 19:14:51', '2025-08-08 19:20:30'),
(32, 3, 56, 55, 'text', 'How are you', NULL, '2025-08-08 19:14:55', '2025-08-08 19:20:30'),
(33, 7, 56, 57, 'text', 'Hi how are you', NULL, '2025-08-08 19:17:59', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`conversation_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_receiver` (`receiver_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
