import type { DestinationJson } from "@/app/api/destinations/types";

type DestinationsTableProps = {
  destinations: DestinationJson[];
};

const DestinationsTable = ({ destinations }: DestinationsTableProps) => (
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
      {destinations.map((destination) => (
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
);

export { DestinationsTable };
