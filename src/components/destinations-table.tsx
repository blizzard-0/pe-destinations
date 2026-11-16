import type { DestinationJson } from "@/app/api/destinations/types";
import { formatCurrency, formatNumber } from "@/lib/format";

type DestinationsTableProps = {
  destinations: DestinationJson[];
};

const headerClass = "px-4 py-3 font-semibold";
const cellClass = "px-4 py-3";

const DestinationsTable = ({ destinations }: DestinationsTableProps) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200 text-sm">
      <caption className="sr-only">Travel destinations</caption>
      <thead className="bg-gray-50 text-gray-700">
        <tr>
          <th scope="col" className={`${headerClass} text-left`}>
            Name
          </th>
          <th scope="col" className={`${headerClass} text-left`}>
            Country
          </th>
          <th scope="col" className={`${headerClass} text-left`}>
            Region
          </th>
          <th scope="col" className={`${headerClass} text-left`}>
            Cost level
          </th>
          <th scope="col" className={`${headerClass} text-left`}>
            Activities
          </th>
          <th scope="col" className={`${headerClass} text-right`}>
            Avg. daily budget
          </th>
          <th scope="col" className={`${headerClass} text-right`}>
            Annual visitors
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {destinations.map((destination) => (
          <tr key={destination.id} className="align-top">
            <th
              scope="row"
              className={`${cellClass} text-left font-medium text-gray-900`}
            >
              {destination.name}
            </th>
            <td className={cellClass}>{destination.country}</td>
            <td className={cellClass}>{destination.region}</td>
            <td className={cellClass}>{destination.costLevel}</td>
            <td className={cellClass}>
              <ul className="flex flex-wrap gap-1">
                {destination.activities.map((activity) => (
                  <li
                    key={activity}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                  >
                    {activity}
                  </li>
                ))}
              </ul>
            </td>
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatCurrency(destination.averageDailyBudget)}
            </td>
            <td className={`${cellClass} text-right tabular-nums`}>
              {formatNumber(destination.annualVisitors)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export { DestinationsTable };
