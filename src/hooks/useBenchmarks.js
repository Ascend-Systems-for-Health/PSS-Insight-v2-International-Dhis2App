import { useDataEngine } from "@dhis2/app-runtime";
import { useEffect, useState } from "react";
import { formatBenchmarkElements, mapDataElementsToValues } from "./controllers/benchmarksController";

export default function useBenchmarks() {
  const [benchmarkDataSet, setBenchmarkDataSet] = useState(null);
  const [dataValues, setDataValues] = useState([]);

  const engine = useDataEngine();

  const getDataSet = async () => {
    const dataSet = await getBenchmarkDataSet();
    const orgUnit = await getOrgUnit();

    const dataValues = await getDataValues({
      params: {
        period: new Date().getFullYear() - 1,
        dataSet: dataSet.id,
        orgUnit,
      },
    });

    const formattedValues = formatBenchmarkElements(dataValues, dataSet.id);

    setDataValues(formattedValues);

    return formattedValues;
  };

  const getOrgUnit = async () => {
    const { data } = await engine.query({
      data: {
        resource: "organisationUnits",
        params: {
          fields: ["id", "code", "name"],
          filter: "level:eq:1",
          pageSize: 1,
        },
      },
    });

    return data?.organisationUnits[0]?.id;
  };

  const getDataElements = async () => {
    const { data } = await engine.query({
      data: {
        resource: "dataElements",
        params: {
          fields: ["id", "code", "name"],
          filter: "name:ilike:benchmark",
          pageSize: 1000,
        },
      },
    });
    return data ? data.dataElements : null;
  };

  const getBenchmarkDataSet = async () => {
    const { data } = await engine.query({
      data: {
        resource: "dataSets",
        params: {
          fields: ["id", "displayName", "dataSetElements[dataElement[id,displayName]]"],
          filter: "name:ilike:benchmark",
        },
      },
    });
    return data ? data.dataSets[0] : null;
  };

  const getDataValues = async ({ params }) => {
    const { data } = await engine.query({
      data: {
        resource: "dataValueSets",
        params: {
          ...params,
          fields: ["dataValues[dataElement,value,period,orgUnit]"],
        },
      },
    });
    const dataElements = await getDataElements();

    return mapDataElementsToValues(dataElements, data?.dataValues);
  };

  const saveDataValues = async (dataValues, dataSet = null) => {
    const orgUnit = await getOrgUnit();
    const response = await engine.mutate({
      resource: "dataValueSets",
      type: "create",
      data: {
        dataSet,
        orgUnit,
        period: new Date().getFullYear() - 1,
        dataValues,
      },
    });
    if (response) getDataSet();
  };

  const updateDataValues = async ({ dataValues }) => {
    await engine.mutate({
      resource: "dataValues",
      type: "update",
      data: {
        dataValues,
      },
    });
  };

  const deleteDataValues = async ({ dataValues }) => {
    await engine.mutate({
      resource: "dataValues",
      type: "delete",
      data: {
        dataValues,
      },
    });
  };

  return {
    benchmarkDataSet,
    dataValues,
    setDataValues,
    saveDataValues,
    updateDataValues,
    deleteDataValues,
    getDataSet,
  };
}
