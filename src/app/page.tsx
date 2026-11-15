"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);

  useEffect(() => {
    console.log("fetching destinations...");
    fetch("/api/destinations").then((response) => {
      response.json().then((jsonResponse) => {
        setDestinations(jsonResponse.data);
        setFilteredDestinations(jsonResponse.data);
      });
    });
  }, []);

  const onChange = (e) => {
    const searchTerm = e.target.value;

    document.getElementById("search-term").innerHTML = searchTerm;

    console.log("filtering destinations...");
    const filteredDestinations = destinations.filter((destination) => {
      return (
        destination.name.includes(searchTerm) ||
        destination.country.includes(searchTerm) ||
        destination.region.includes(searchTerm) ||
        destination.costLevel.includes(searchTerm) ||
        destination.activities.includes(searchTerm) ||
        destination.averageDailyBudget.includes(searchTerm)
      );
    });

    setFilteredDestinations(filteredDestinations);
  };

  const onClick = () => {
    console.log(destinations);
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
          Searching for: <span id="search-term"></span>
        </p>
        <input style={{ border: "1px solid black" }} onChange={onChange} />
        <button onClick={onClick}>Reset Search</button>
      </div>
      <br />
      <br />
      <table>
        <thead>
          <th>Name</th>
          <th>Country</th>
          <th>Region</th>
          <th>Cost Level</th>
          <th>Activities</th>
          <th>Avg. Daily Budget</th>
          <th>Annual Visitors</th>
        </thead>
        <tbody>
          {filteredDestinations.map((destination) => {
            return (
              <tr>
                <td>{destination.name}</td>
                <td>{destination.country}</td>
                <td>{destination.region}</td>
                <td>{destination.costLevel}</td>
                <td>
                  {destination.activities.map((a) => (
                    <div>{a}</div>
                  ))}
                </td>
                <td>{destination.averageDailyBudget}</td>
                <td>{destination.annualVisitors}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
