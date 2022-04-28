// dummy module
// TODO: should be replaced to proper library

const renderCsv = (content) => {
  const table = content.split("\n").map((s) => s.split(","));
  return (
    <table>
      <tbody>
        {table.map((row, i) => (
          <tr key={"r" + i}>
            {row.map((item, j) => <td key={"r" + i + "c" + j}>{item}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default renderCsv;
