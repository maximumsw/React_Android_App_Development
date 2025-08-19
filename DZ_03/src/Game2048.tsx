import React, { useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";

type Board = number[][];
const SIZE = 4;

function makeEmptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function clone(board: Board): Board {
  return board.map(r => [...r]);
}

function transpose(board: Board): Board {
  const res = makeEmptyBoard();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      res[c][r] = board[r][c];
    }
  }
  return res;
}

function reverseRows(board: Board): Board {
  return board.map(row => [...row].reverse());
}

function slideRowLeft(row: number[]): { row: number[]; gained: number } {
  const nonZero = row.filter(v => v !== 0);
  const merged: number[] = [];
  let gained = 0;

  for (let i = 0; i < nonZero.length; i++) {
    if (nonZero[i] === nonZero[i + 1]) {
      const val = nonZero[i] * 2;
      merged.push(val);
      gained += val;
      i++; // пропускаємо наступний, бо змерджений
    } else {
      merged.push(nonZero[i]);
    }
  }
  // добиваємо нулями
  while (merged.length < SIZE) merged.push(0);
  return { row: merged, gained };
}

function moveLeft(board: Board): { board: Board; gained: number; moved: boolean } {
  const next = makeEmptyBoard();
  let gained = 0;
  let moved = false;

  for (let r = 0; r < SIZE; r++) {
    const before = board[r];
    const { row, gained: g } = slideRowLeft(before);
    next[r] = row;
    gained += g;
    if (!arraysEqual(before, row)) moved = true;
  }
  return { board: next, gained, moved };
}

// РУХ ВГОРУ: транспонуємо, рухаємо вліво, транспонуємо назад
function moveUp(board: Board) {
  const t = transpose(board);
  const { board: movedT, gained, moved } = moveLeft(t);
  return { board: transpose(movedT), gained, moved };
}

// РУХ ВНИЗ: транспонуємо, розвертаємо рядки, рухаємо вліво, повертаємо все назад
function moveDown(board: Board) {
  const t = transpose(board);
  const rev = reverseRows(t);
  const { board: movedRev, gained, moved } = moveLeft(rev);
  const unrev = reverseRows(movedRev);
  return { board: transpose(unrev), gained, moved };
}

function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function emptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile(board: Board): Board {
  const cells = emptyCells(board);
  if (cells.length === 0) return board;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  const val = Math.random() < 0.9 ? 2 : 4;
  const next = clone(board);
  next[r][c] = val;
  return next;
}

function hasMoves(board: Board) {
  if (emptyCells(board).length > 0) return true;
  // перевірка можливих мерджів
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = board[r][c];
      if ((r + 1 < SIZE && board[r + 1][c] === v) || (c + 1 < SIZE && board[r][c + 1] === v)) {
        return true;
      }
    }
  return false;
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => addRandomTile(addRandomTile(makeEmptyBoard())));
  const [score, setScore] = useState(0);

  const scale = useRef(new Animated.Value(1)).current;
  const animateScore = (pointsAdded: number) => {
    if (pointsAdded <= 0) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
  };

  const doMove = (dir: "up" | "down") => {
    const current = board;
    const { board: movedBoard, gained, moved } = dir === "up" ? moveUp(current) : moveDown(current);
    if (!moved) return;
    const withTile = addRandomTile(movedBoard);
    setBoard(withTile);
    if (gained > 0) {
      setScore(s => s + gained);
      animateScore(gained);
    }
  };

  const controls = useMemo(
    () => (
      <View style={styles.controlsRow}>
        <Pressable onPress={() => doMove("up")} style={styles.btn}><Text style={styles.btnTxt}>↑</Text></Pressable>
        <Pressable onPress={() => doMove("down")} style={styles.btn}><Text style={styles.btnTxt}>↓</Text></Pressable>
      </View>
    ),
    [board, score]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.Text style={[styles.score, { transform: [{ scale }] }]}>
          Score: {score}
        </Animated.Text>
      </View>

      <View style={styles.grid}>
        {board.map((row, rIdx) => (
          <View style={styles.row} key={`r-${rIdx}`}>
            {row.map((cell, cIdx) => (
              <View key={`c-${rIdx}-${cIdx}`} style={[styles.cell, cellStyle(cell)]}>
                <Text style={[styles.tileText, cellTextStyle(cell)]}>{cell === 0 ? "" : cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {controls}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#faf8ef", padding: 16 },
  header: { width: "100%", alignItems: "center", marginBottom: 8 },
  score: { fontSize: 24, fontWeight: "700", color: "#776e65" },
  grid: { backgroundColor: "#bbada0", padding: 8, borderRadius: 12 },
  row: { flexDirection: "row" },
  cell: {
    width: 72, height: 72, margin: 6, borderRadius: 8,
    alignItems: "center", justifyContent: "center", backgroundColor: "#cdc1b4",
  },
  tileText: { fontSize: 24, fontWeight: "800" },
  controlsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  btn: { backgroundColor: "#8f7a66", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnTxt: { color: "white", fontSize: 18, fontWeight: "700" },
});

function cellStyle(val: number) {
  const map: Record<number, string> = {
    0: "#cdc1b4", 2: "#eee4da", 4: "#ede0c8", 8: "#f2b179",
    16: "#f59563", 32: "#f67c5f", 64: "#f65e3b", 128: "#edcf72",
    256: "#edcc61", 512: "#edc850", 1024: "#edc53f", 2048: "#edc22e",
  };
  return { backgroundColor: map[val] ?? "#3c3a32" };
}
function cellTextStyle(val: number) {
  const dark = [2, 4];
  return { color: dark.includes(val) ? "#776e65" : "#f9f6f2" };
}
