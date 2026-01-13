-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 18, 2025 at 01:53 PM
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
-- Database: `digitaltwin`
--
CREATE DATABASE IF NOT EXISTS `digitaltwin` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `digitaltwin`;

-- --------------------------------------------------------

--
-- Table structure for table `agent`
--

CREATE TABLE `agent` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agent`
--

INSERT INTO `agent` (`id`, `name`, `type`, `created_at`) VALUES
(1, 'Agent Alpha', 'Drone', '2025-12-18 12:35:55'),
(2, 'Agent Beta', 'Robot', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `agentobservation`
--

CREATE TABLE `agentobservation` (
  `id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `polygon_id` int(11) NOT NULL,
  `observation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agentobservation`
--

INSERT INTO `agentobservation` (`id`, `agent_id`, `polygon_id`, `observation`, `created_at`) VALUES
(1, 1, 1, 'Observation 1 for Polygon 1', '2025-12-18 12:35:55'),
(2, 2, 2, 'Observation 2 for Polygon 2', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `llmanalysis`
--

CREATE TABLE `llmanalysis` (
  `id` int(11) NOT NULL,
  `polygon_id` int(11) NOT NULL,
  `analysis` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `llmanalysis`
--

INSERT INTO `llmanalysis` (`id`, `polygon_id`, `analysis`, `created_at`) VALUES
(1, 1, 'Analysis 1 for Polygon 1', '2025-12-18 12:35:55'),
(2, 2, 'Analysis 2 for Polygon 2', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `object_type`
--

CREATE TABLE `object_type` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `object_type`
--

INSERT INTO `object_type` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Type X', 'Test object type X', '2025-12-18 12:35:55'),
(2, 'Type Y', 'Test object type Y', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `polygon`
--

CREATE TABLE `polygon` (
  `id` int(11) NOT NULL,
  `scenario_id` int(11) NOT NULL,
  `object_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `coordinates` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `polygon`
--

INSERT INTO `polygon` (`id`, `scenario_id`, `object_id`, `agent_id`, `name`, `coordinates`, `created_at`) VALUES
(1, 1, 1, 1, 'Polygon 1', '[[0,0],[1,0],[1,1],[0,1]]', '2025-12-18 12:35:55'),
(2, 2, 2, 2, 'Polygon 2', '[[2,2],[3,2],[3,3],[2,3]]', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `scenario`
--

CREATE TABLE `scenario` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `scenario`
--

INSERT INTO `scenario` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'Scenario A', 'Test scenario A', '2025-12-18 12:35:55'),
(2, 'Scenario B', 'Test scenario B', '2025-12-18 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `simresult`
--

CREATE TABLE `simresult` (
  `id` int(11) NOT NULL,
  `scenario_id` int(11) NOT NULL,
  `result` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `simresult`
--

INSERT INTO `simresult` (`id`, `scenario_id`, `result`, `created_at`) VALUES
(1, 1, 'Simulation result for Scenario A', '2025-12-18 12:35:55'),
(2, 2, 'Simulation result for Scenario B', '2025-12-18 12:35:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agent`
--
ALTER TABLE `agent`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `agentobservation`
--
ALTER TABLE `agentobservation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agentObs_agent_id` (`agent_id`),
  ADD KEY `idx_agentObs_polygon_id` (`polygon_id`);

--
-- Indexes for table `llmanalysis`
--
ALTER TABLE `llmanalysis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_llm_polygon_id` (`polygon_id`);

--
-- Indexes for table `object_type`
--
ALTER TABLE `object_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `polygon`
--
ALTER TABLE `polygon`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_polygon_scenario_id` (`scenario_id`),
  ADD KEY `idx_polygon_object_id` (`object_id`),
  ADD KEY `idx_polygon_agent_id` (`agent_id`);

--
-- Indexes for table `scenario`
--
ALTER TABLE `scenario`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `simresult`
--
ALTER TABLE `simresult`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sim_scenario_id` (`scenario_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agent`
--
ALTER TABLE `agent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `agentobservation`
--
ALTER TABLE `agentobservation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `llmanalysis`
--
ALTER TABLE `llmanalysis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `object_type`
--
ALTER TABLE `object_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `polygon`
--
ALTER TABLE `polygon`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `scenario`
--
ALTER TABLE `scenario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `simresult`
--
ALTER TABLE `simresult`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agentobservation`
--
ALTER TABLE `agentobservation`
  ADD CONSTRAINT `fk_agentObs_agent` FOREIGN KEY (`agent_id`) REFERENCES `agent` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_agentObs_polygon` FOREIGN KEY (`polygon_id`) REFERENCES `polygon` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `llmanalysis`
--
ALTER TABLE `llmanalysis`
  ADD CONSTRAINT `fk_llm_polygon` FOREIGN KEY (`polygon_id`) REFERENCES `polygon` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `polygon`
--
ALTER TABLE `polygon`
  ADD CONSTRAINT `fk_polygon_agent` FOREIGN KEY (`agent_id`) REFERENCES `agent` (`id`),
  ADD CONSTRAINT `fk_polygon_object_type` FOREIGN KEY (`object_id`) REFERENCES `object_type` (`id`),
  ADD CONSTRAINT `fk_polygon_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenario` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `simresult`
--
ALTER TABLE `simresult`
  ADD CONSTRAINT `fk_sim_scenario` FOREIGN KEY (`scenario_id`) REFERENCES `scenario` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
