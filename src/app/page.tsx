"use client";

import { useEffect, useState, type ChangeEvent } from "react";

import type { DestinationJson } from "@/app/api/destinations/types";

export default function Home() {
  const [destinations, setDestinations] = useState<DestinationJson[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<
    DestinationJson[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/destinations").then((response) => {
      response.json().then((jsonResponse) => {
        setDestinations(jsonResponse.data);
        setFilteredDestinations(jsonResponse.data);
      });
    });
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    setFilteredDestinations(
      destinations.filter(
        (destination) =>
          destination.name.includes(term) ||
          destination.country.includes(term) ||
          destination.region.includes(term) ||
          destination.costLevel.includes(term) ||
          destination.activities.includes(term),
      ),
    );
  };

  const onReset = () => {
    setSearchTerm("");
    setFilteredDestinations(destinations);
  };

  return (
    <main style={{ margin: "24px" }}>
      <h1>Project Expedition Destinations</h1>
      <br />
      <br />
      <div>
        <p>Search</p>
        <p>
          Searching for: <span>{searchTerm}</span>
        </p>
        <input
          style={{ border: "1px solid black" }}
          value={searchTerm}
          onChange={onChange}
        />
        <button onClick={onReset}>Reset Search</button>
      </div>

      <br />
      <br />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
            <th>Region</th>
            <th>Cost Level</th>
            <th>Activities</th>
            <th>Avg. Daily Budget</th>
            <th>Annual Visitors</th>
          </tr>
        </thead>
        <tbody>
          {filteredDestinations.map((destination) => (
            <tr key={destination.id}>
              <td>{destination.name}</td>
              <td>{destination.country}</td>
              <td>{destination.region}</td>
              <td>{destination.costLevel}</td>
              <td>
                {destination.activities.map((activity) => (
                  <div key={activity}>{activity}</div>
                ))}
              </td>
              <td>{destination.averageDailyBudget}</td>
              <td>{destination.annualVisitors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
