// TODO: should be replaced to proper library
import { Table, TableBody, TableCell, TableRow } from "@mui/material";

const CsvRenderer = (props: { content: string }) => {
    const table = props.content.split("\n").map((s) => s.split(","));
    return (
        <Table>
            <TableBody>
                {table.map((row, i) => (
                    <TableRow key={"r" + i}>
                        {row.map((item, j) => (
                            <TableCell key={"r" + i + "c" + j}>
                                {item}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default CsvRenderer;
