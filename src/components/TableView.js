import React, { useMemo, useState, useEffect } from "react";
import { MaterialReactTable } from "material-react-table";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { TextField, Button } from "@mui/material";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
 
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
 
const TableView = () => {
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [viewSettings, setViewSettings] = useState({});
  const navigate = useNavigate();
  const [loadingState, setLoading] = useState(true);
 
  // Load and parse CSV data
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("./data.csv");
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let result;
      let csvData = "";
 
      while (!(result = await reader.read()).done) {
        csvData += decoder.decode(result.value, { stream: true });
      }
 
      const parsedData = Papa.parse(csvData, { header: true }).data;
      setTableData(parsedData);
      updateChartData(parsedData);
      setLoading(false);
    };
 
    const urlParams = new URLSearchParams(window.location.search);
    const savedSettings = urlParams.get("settings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(decodeURIComponent(savedSettings));
      setTableData(parsedSettings.tableData);
      setChartData(parsedSettings.chartData);
      setViewSettings(parsedSettings.viewSettings);
      setLoading(false);
    } else {
      fetchData();
    }
   
  }, []);
 
  // Function to update chart data based on filtered data
  const updateChartData = (data) => {
    const filteredData = data?.filter((d) => d?.out_of_service_date !== "");
    const labels = [
      ...new Set(
        filteredData?.map((d) =>
          new Date(d?.out_of_service_date)?.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })
        )
      ),
    ];
    const chartDataset = labels?.map(
      (label) =>
        filteredData?.filter(
          (d) =>
            new Date(d?.out_of_service_date)?.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }) === label
        ).length
    );
 
    const newChartData = {
      labels,
      datasets: [
        {
          label: "Out of Service by Month",
          data: chartDataset,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
    setChartData(newChartData);
    localStorage.setItem("chartData", JSON.stringify(newChartData));
  };
 
  const columns = useMemo(
    () => [
      {
        header: "Created Date",
        accessorKey: "created_dt",
      },
      {
        header: "Entity Type",
        accessorKey: "entity_type",
        filterVariant: "select",
      },
      {
        header: "Operating Status",
        accessorKey: "operating_status",
      },
      {
        header: "Legal Name",
        accessorKey: "legal_name",
      },
      {
        header: "Out of Service Date",
        accessorKey: "out_of_service_date",
        Cell: ({ cell, row, column }) => {
          const dateValue = cell.getValue();
          const formattedDate = dateValue
            ? new Date(dateValue).toISOString().slice(0, 16)
            : "";
          return (
            <TextField
              type="date"
              defaultValue={formattedDate}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                const formattedDate =
                  ("0" + (newDate.getMonth() + 1)).slice(-2) +
                  "/" +
                  ("0" + newDate.getDate()).slice(-2) +
                  "/" +
                  newDate.getFullYear();
                const updatedData = [...tableData];
                updatedData[row.index][column.id] = formattedDate;
                setTableData(updatedData);
                updateChartData(updatedData);
              }}
            />
          );
        },
        sortingFn: "datetime",
      },
      {
        header: "USDOT Number",
        accessorKey: "usdot_number",
      },
    ],
    [tableData]
  );
 
  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("TableViewDB", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("settings", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event);
    });
  };
 
  const saveSettingsToDB = async (settings) => {
    const db = await openDB();
    const transaction = db.transaction("settings", "readwrite");
    transaction
      .objectStore("settings")
      .put({ id: "tableSettings", ...settings });
    return transaction.complete;
  };
 
  const loadSettingsFromDB = async () => {
    const db = await openDB();
    const transaction = db.transaction("settings", "readonly");
    const settings = transaction.objectStore("settings").get("tableSettings");
    return new Promise((resolve) => {
      settings.onsuccess = () => resolve(settings.result);
    });
  };
 
  const handleSaveSettings = async () => {
    const settings = {
      tableData,
      chartData,
      viewSettings,
    };
    await saveSettingsToDB(settings);
    alert("Settings saved to IndexedDB!");
  };
 
  const handleLoadSettings = async () => {
    const settings = await loadSettingsFromDB();
    if (settings) {
      setTableData(settings.tableData);
      setChartData(settings.chartData);
      setViewSettings(settings.viewSettings);
      alert("Settings loaded from IndexedDB!");
    } else {
      alert("No saved settings found.");
    }
  };
 
  const handleResetSettings = () => {
    localStorage.removeItem("tableData");
    localStorage.removeItem("chartData");
    window.location.reload();
  };
 
  const handleGenerateShareLink = () => {
    const settings = {
      tableData,
      chartData,
      viewSettings,
    };
    const encodedSettings = encodeURIComponent(JSON.stringify(settings));
    const shareLink = `${window.location.origin}${window.location.pathname}?settings=${encodedSettings}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      alert("Share link copied to clipboard!");
    });
  };
 

 
  const handleClickPivotView = () => {
    navigate("/pivot");
  };
 
  return (
    <div>
      <h2 style={{ padding: "0px 10px" }}>Table view</h2>
      <Button color="success" varient="outlined" onClick={handleClickPivotView}>
        Pivot View
      </Button>
      {
       
          (loadingState) ?
          <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",    
            height: "100vh",          
          }}
        >
          <CircularProgress />
        </div>
       
          :
          <>
          <MaterialReactTable
            columns={columns}
            data={tableData}
            initialState={{
              pagination: { pageSize: 10 },
              sorting: [{ id: "out_of_service_date", desc: true }],
            }}
            enableSorting
            enableGlobalFilter
            enablePagination
            enableColumnResizing
            enableColumnOrdering
            enableFilters
            manualSorting
          />
          <h2 style={{ padding: "0px 10px" }}>Chart</h2>
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "right",
              gap: "20px",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleLoadSettings}
            >
              Load Settings
            </Button>
            <Button variant="contained" onClick={handleResetSettings}>
              Reset to Default
            </Button>
            <Button variant="contained" onClick={handleGenerateShareLink}>
              Generate Share Link
            </Button>
          </div>
          <Bar data={chartData} />
        </>
      }
    </div>
  );
};
 
export default TableView;