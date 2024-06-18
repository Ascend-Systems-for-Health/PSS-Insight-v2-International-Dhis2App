import { Checkbox } from "@dhis2/ui";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { InputNumber, Table } from "antd";
import React, { useState } from "react";
import { createUseStyles } from "react-jss";
import EditModal from "./EditModal";
import InfoModal from "./InfoModal";

const useStyles = createUseStyles({
  "@global": {
    ".ant-table-thead th": {
      background: "#D9E8F5 !important",
      borderRadius: "0 !important",
    },
  },
  indicatorStack: {
    display: "grid",
    gridTemplateColumns: "4rem auto 8rem",
    margin: "10px 0",
    border: "1px solid #e0e0e0",
  },
  indicatorCheckbox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorTable: {
    width: "100%",
  },

  benchmarkHeader: {
    background: "#D9E8F5 !important",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
    height: "40px",
    padding: "0 5px",
  },
  benchmarkContent: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  tableFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: "3rem",
    position: "relative",
    width: "100%",
  },
  info: {
    position: "absolute",
    right: "0",
    cursor: "pointer",
    width: "1.5rem",
    height: "1.5rem",
    color: "#0067B9",
  },
});

export default function IndicatorStack({ indicator, disabled, referenceSheet, setBenchmarks, selected, setSelected }) {
  const classes = useStyles();
  const [editModal, setEditModal] = useState(null);
  const [infoModal, setInfoModal] = useState(null);

  const columns = [
    {
      title: indicator.code || "",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: indicator.categoryName || "",
      dataIndex: "indicatorName",
      key: "indicatorName",
    },
  ];

  return (
    <div className={classes.indicatorStack}>
      <div className={classes.indicatorCheckbox}>
        <Checkbox
          disabled={disabled}
          checked={selected?.includes(indicator.id)}
          onChange={({ checked }) => {
            if (checked) {
              setSelected([...selected, indicator.id]);
            } else {
              setSelected(selected.filter((id) => id !== indicator.id));
            }
          }}
        />
      </div>
      <div className={classes.indicatorTable}>
        {<Table columns={columns} dataSource={indicator.indicators} bordered size='small' pagination={false} />}
      </div>
      <div>
        <div className={classes.benchmarkHeader}>
          <div className={classes.tableFlex}>
            <span>Benchmark</span>
            <ExclamationCircleIcon className={classes.info} onClick={() => setInfoModal(indicator)} />
          </div>
        </div>
        <div className={classes.benchmarkContent}>
          <InputNumber
            disabled={disabled}
            defaultValue={indicator.benchmark}
            onBlur={(e) => {
              setBenchmarks((prev) => {
                const index = prev.findIndex((b) => b.dataElement === indicator.benchmarkId);
                prev[index].value = Number(e.target.value);
                return [...prev];
              });
            }}
          />
        </div>
      </div>
      <EditModal
        key={editModal?.categoryId || editModal?.id}
        title='EDIT INSTANCE'
        onCancel={() => setEditModal(null)}
        open={editModal}
        type='info'
        onOk={() => setEditModal(null)}
      />
      <InfoModal
        key={infoModal?.id}
        title={`${infoModal?.code || ""} DEFINITION`}
        onCancel={() => setInfoModal(null)}
        open={infoModal}
        type='info'
        footer={null}
        uuid={indicator.uuid}
        referenceSheet={referenceSheet}
      />
    </div>
  );
}
