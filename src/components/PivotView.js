import React, { useState, useEffect } from 'react';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import 'react-pivottable/pivottable.css';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Papa from 'papaparse';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PivotView = () => {
  const [pivotState, setPivotState] = useState({ data: [] });
  const [csvData, setCsvData] = useState([]);
  const navigate  = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/data.csv'); // Adjust the path to your CSV file as needed
      const reader = response.body.getReader();
      const result = await reader.read();
      const decoder = new TextDecoder('utf-8');
      const csvText = decoder.decode(result.value);
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        complete: (parsedData) => {
          setCsvData(parsedData.data);
          setPivotState({ data: parsedData.data });
        },
      });
    };

    fetchData();
  }, []);

  const chartData = {
    labels: pivotState.rows || [],
    datasets: [
      {
        label: 'Pivot Chart',
        data: pivotState.cols ? pivotState.cols.map(col => pivotState.data.reduce((acc, row) => acc + row[col], 0)) : [],
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const handleClickPivotView = () =>{
    navigate("/")
  }

  return (
    <>
    <Button color="success" varient="outlined" onClick={handleClickPivotView}>Back to Table View</Button>
    <div>
      <PivotTableUI data={csvData} onChange={s => setPivotState(s)} {...pivotState} />
      <Bar data={chartData} />
    </div>
    </>
  );
};

export default PivotView;