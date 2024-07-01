import { sortIndicatorsByKey } from "../../utils/helpers";

const removeBenchmark = (str) => str.replace(/_?benchmark_?/gi, "");

export const formatBenchmarkElements = (datasets, datasetId) => {
  return datasets?.map((element) => ({ ...element, name: removeBenchmark(element.name), datasetId }));
};

export const mapDataElementsToValues = (dataElements, dataValues) => {
  const values = dataValues?.reduce((acc, cur) => {
    if (!acc.some((dv) => dv.dataElement === cur.dataElement)) {
      acc.push(cur);
    }
    return acc;
  }, []);

  return dataElements?.map((de) => {
    const value = values.find((v) => v.dataElement === de.id);
    return {
      ...de,
      ...value,
      value: value?.value || 0,
    };
  });
};

export const mergeBenchmarks = (indicators, benchmarks) => {
  return indicators?.map((indicator) => {
    let sortedIndicators = sortIndicatorsByKey(indicator?.indicators);
    sortedIndicators = sortedIndicators.map((item) => {
      const benchmark = benchmarks.find((b) => b.name === item?.categoryName);
      return { ...item, benchmark: benchmark?.value || 0, benchmarkId: benchmark?.id, datasetId: benchmark?.datasetId };
    });

    const indicatorElement = sortedIndicators[0];
    const benchmark = benchmarks.find((b) => b.name === indicatorElement?.categoryName);

    return {
      ...indicator,
      code: indicatorElement?.categoryName,
      title: indicatorElement?.name,
      id: indicatorElement?.categoryId,
      benchmark: benchmark?.value || 0,
      benchmarkId: benchmark?.id,
      datasetId: benchmark?.datasetId,
      indicators: sortedIndicators,
      uuid: indicatorElement?.uuid,
    };
  });
};

export const formatBenchmarkValues = ({ id, value }, indicators) => {
  return indicators.map((item) => ({
    dataElement: item.benchmarkId,
    value: item.id === id ? value : item.benchmark,
  }));
};
