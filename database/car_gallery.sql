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
(21, 3, '/uploads/cars/car-1754572060300-742097436.jpg', '2025-08-07 13:07:40'),
(22, 3, '/uploads/cars/car-1754572060300-304265298.jpg', '2025-08-07 13:07:40'),
(23, 3, '/uploads/cars/car-1754572060301-258018338.jpg', '2025-08-07 13:07:40'),
(24, 3, '/uploads/cars/car-1754572060301-495709472.jpg', '2025-08-07 13:07:40'),
(29, 5, '/uploads/cars/car-1754577889774-338653659.jpg', '2025-08-07 14:44:49'),
(30, 5, '/uploads/cars/car-1754577889775-305321046.jpg', '2025-08-07 14:44:49'),
(31, 5, '/uploads/cars/car-1754577889809-544618675.jpg', '2025-08-07 14:44:49'),
(32, 5, '/uploads/cars/car-1754577889811-898012892.jpg', '2025-08-07 14:44:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `car_gallery`
--
ALTER TABLE `car_gallery`
  ADD PRIMARY KEY (`id`),
  ADD KEY `car_id` (`car_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `car_gallery`
--
ALTER TABLE `car_gallery`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `car_gallery`
--
ALTER TABLE `car_gallery`
  ADD CONSTRAINT `car_gallery_ibfk_1` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
