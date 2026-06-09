import React, { useEffect } from 'react';
import Chart from 'chart.js/auto'; 

const DoubleDonutChart = ({data}) => {

   
    useEffect(() => {
        var ctx = document.getElementById('doubleDonutChart').getContext('2d');
        
        var doubleDonutChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [100 - (data[0]?.percentage_approver ? data[0]?.percentage_approver : 0), data[0]?.percentage_approver ? data[0]?.percentage_approver : 0],
                    backgroundColor: [
                        '#F5F9FF',
                        '#F6BD3D',
                    ],
                    borderWidth: 10,
                    radius: 100 ,
                    hoverBorderWidth:1,
                    
                }, {
                    data: [100 - (data[0]?.percentage_preparer ? data[0]?.percentage_preparer : 0), data[0]?.percentage_preparer ? data[0]?.percentage_preparer : 0],
                    backgroundColor: [
                        '#F5F9FF',
                        '#307FF4',
                    ],
                    borderWidth: 10,
                    radius: 90,
                    hoverBorderWidth:1

                }]
            },
            options: {
                cutoutPercentage: 0,

            }
        });

        // Clean up the chart instance when the component unmounts
        return () => {
            doubleDonutChart.destroy();
        };
    }, [data]);

    return (
        <canvas id="doubleDonutChart" width="400" height="400"></canvas>
    );
};

export default DoubleDonutChart;
