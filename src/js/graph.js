// グラフ描画モジュール
import { getYearlyData } from './price.js';

// Chart.jsはCDNから読み込まれるため、グローバル変数として使用
const { Chart } = window;

let chartInstance = null;
let pluginsRegistered = false;
let cachedImagePattern = null;
let imagePatternLoading = false;

/**
 * 画像パターンを事前に読み込む
 */
const loadImagePattern = (ctx, imageUrl) => {
  return new Promise((resolve) => {
    if (cachedImagePattern) {
      resolve(cachedImagePattern);
      return;
    }

    if (imagePatternLoading) {
      // 既に読み込み中の場合は、読み込み完了を待つ
      const checkInterval = setInterval(() => {
        if (cachedImagePattern) {
          clearInterval(checkInterval);
          resolve(cachedImagePattern);
        } else if (!imagePatternLoading) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 50);
      return;
    }

    imagePatternLoading = true;
    const img = new Image();
    let resolved = false;

    // タイムアウトを設定（3秒）
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        imagePatternLoading = false;
        resolve(null);
      }
    }, 3000);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        cachedImagePattern = ctx.createPattern(img, 'repeat');
        imagePatternLoading = false;
        resolve(cachedImagePattern);
      }
    };
    img.onerror = (error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        imagePatternLoading = false;
        resolve(null);
      }
    };
    // パスを試す: まず相対パス、次に絶対パス
    img.src = imageUrl;
  });
};

/**
 * Y軸の最大値と刻みを計算
 * @param {number} maxValue - 最大値（円）
 * @returns {{max: number, step: number}}
 */
const calculateYAxis = (maxValue) => {
  const maxInMan = maxValue / 10000; // 万円単位に変換
  // 実際の最大値に10%の余裕を持たせる
  const maxWithMargin = maxInMan * 1.1;
  let max, step;

  if (maxInMan <= 100) {
    // 100万以下: 20万単位
    step = 20;
    max = Math.ceil(maxWithMargin / step) * step;
  } else if (maxInMan <= 500) {
    // 500万以下: 100万単位
    step = 100;
    max = Math.ceil(maxWithMargin / step) * step;
  } else if (maxInMan <= 1000) {
    // 1000万以下: 100万単位（200万単位から変更）
    step = 100;
    max = Math.ceil(maxWithMargin / step) * step;
  } else if (maxInMan <= 2500) {
    // 2500万以下: 200万単位（500万単位から変更）
    step = 200;
    max = Math.ceil(maxWithMargin / step) * step;
  } else if (maxInMan <= 5000) {
    // 5000万以下: 500万単位（1000万単位から変更）
    step = 500;
    max = Math.ceil(maxWithMargin / step) * step;
  } else {
    // 5000万超: 1000万単位
    step = 1000;
    max = Math.ceil(maxWithMargin / step) * step;
  }

  return { max, step };
};

/**
 * 実線を描画する関数（アニメーション完了後に呼び出される）
 */
const drawConnectingLines = (chart, container, canvas, yearlyData, interestRate, years, baseLabel, selectedLabel, baseLine, selectedLine, baseY, selectedY, selectedIndex, labelX, containerHeight) => {
  // 要素が確実に存在するまで待機してから実行
  const trySetLines = (retryCount = 0) => {
    const baseAmountElement = baseLabel.querySelector('.graph-value-label__amount');
    const selectedAmountElement = selectedLabel.querySelector('.graph-value-label__amount');

    if (!baseAmountElement || !selectedAmountElement) {
      if (retryCount < 10) {
        // 最大10回まで再試行（500msまで）
        requestAnimationFrame(() => {
          setTimeout(() => trySetLines(retryCount + 1), 50);
        });
        return;
      }
      return;
    }

    const chartArea = chart.chartArea;
    if (!chartArea) {
      if (retryCount < 10) {
        requestAnimationFrame(() => {
          setTimeout(() => trySetLines(retryCount + 1), 50);
        });
        return;
      }
      return;
    }

    const baseMeta = chart.getDatasetMeta(1);
    const selectedMeta = chart.getDatasetMeta(2);
    const basePoint = baseMeta?.data[selectedIndex];
    const selectedPoint = selectedMeta?.data[selectedIndex];

    if (!basePoint || !selectedPoint) {
      if (retryCount < 10) {
        requestAnimationFrame(() => {
          setTimeout(() => trySetLines(retryCount + 1), 50);
        });
        return;
      }
      return;
    }

    const baseAmountRect = baseAmountElement.getBoundingClientRect();
    const selectedAmountRect = selectedAmountElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const currentOffsetX = canvasRect.left - containerRect.left;
    const currentOffsetY = canvasRect.top - containerRect.top;

    // baseTotalの実線
    // グラフの先端の座標（コンテナからの相対位置）
    const baseGraphPointX = currentOffsetX + basePoint.x;
    const baseGraphPointY = currentOffsetY + basePoint.y;

    // ボーダーの右端の座標（コンテナからの相対位置）
    const baseLineStartXAbsolute = baseAmountRect.right - containerRect.left;
    const baseLineYAbsolute = baseAmountRect.bottom - containerRect.top;

    // 距離と角度を計算（ボーダーの右端からグラフの先端まで）
    const baseDeltaX = baseGraphPointX - baseLineStartXAbsolute;
    const baseDeltaY = baseGraphPointY - baseLineYAbsolute;
    const baseLength = Math.sqrt(baseDeltaX * baseDeltaX + baseDeltaY * baseDeltaY);
    const baseAngle = Math.atan2(baseDeltaY, baseDeltaX) * (180 / Math.PI);

    // CSS変数で位置と角度を設定（値が有効な場合のみ）
    if (baseLength > 0 && !isNaN(baseAngle) && isFinite(baseLength) && isFinite(baseAngle)) {
      baseAmountElement.style.setProperty('--line-length', `${baseLength}px`, 'important');
      baseAmountElement.style.setProperty('--line-angle', `${baseAngle}deg`, 'important');
    }

    // selectedTotalの実線
    // グラフの先端の座標（コンテナからの相対位置）
    const selectedGraphPointX = currentOffsetX + selectedPoint.x;
    const selectedGraphPointY = currentOffsetY + selectedPoint.y;

    // ボーダーの右端の座標（コンテナからの相対位置）
    const selectedLineStartXAbsolute = selectedAmountRect.right - containerRect.left;
    const selectedLineYAbsolute = selectedAmountRect.bottom - containerRect.top;

    // 距離と角度を計算（ボーダーの右端からグラフの先端まで）
    const selectedDeltaX = selectedGraphPointX - selectedLineStartXAbsolute;
    const selectedDeltaY = selectedGraphPointY - selectedLineYAbsolute;
    const selectedLength = Math.sqrt(selectedDeltaX * selectedDeltaX + selectedDeltaY * selectedDeltaY);
    const selectedAngle = Math.atan2(selectedDeltaY, selectedDeltaX) * (180 / Math.PI);

    // CSS変数で位置と角度を設定（値が有効な場合のみ）
    if (selectedLength > 0 && !isNaN(selectedAngle) && isFinite(selectedLength) && isFinite(selectedAngle)) {
      selectedAmountElement.style.setProperty('--line-length', `${selectedLength}px`, 'important');
      selectedAmountElement.style.setProperty('--line-angle', `${selectedAngle}deg`, 'important');
    }
  };

  // 最初の試行を開始
  requestAnimationFrame(() => {
    setTimeout(() => trySetLines(0), 50);
  });
};

/**
 * グラフを描画
 * @param {HTMLCanvasElement} canvas - Canvas要素
 * @param {number} interestRate - 利率（%）
 * @param {number} monthlyAmount - 月額積立額
 * @param {number} years - 期間（年）
 */
export const drawGraph = async (canvas, interestRate, monthlyAmount, years) => {
  // Chart.jsが読み込まれているか確認
  if (!Chart) {
    return;
  }

  // 既存のチャートを破棄
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  // 既存の金額表示要素を削除
  const container = canvas.parentElement;
  const existingLabels = container?.querySelectorAll('.graph-value-label');
  existingLabels?.forEach((label) => {
    // CSS変数もリセット
    const amountElement = label.querySelector('.graph-value-label__amount');
    if (amountElement) {
      amountElement.style.removeProperty('--line-length');
      amountElement.style.removeProperty('--line-angle');
    }
    label.remove();
  });
  const existingLines = container?.querySelectorAll('.graph-value-line');
  existingLines?.forEach((line) => line.remove());

  // Canvasサイズをコンテナから取得
  const rect = container ? container.getBoundingClientRect() : canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width || 535;
  const height = rect.height || 390;

  // Canvasの実際のサイズを設定（高DPI対応）
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Canvasの表示サイズを設定（CSSのaspect-ratioに任せるため、heightは設定しない）
  canvas.style.width = `${width}px`;
  // heightはCSSのaspect-ratioで自動計算されるため、設定しない

  // データを取得
  const yearlyData = getYearlyData(interestRate, monthlyAmount, years);

  if (!yearlyData || yearlyData.length === 0) {
    return;
  }

  const maxValue = Math.max(...yearlyData.map((d) => Math.max(d.baseTotal, d.selectedTotal)));

  if (!isFinite(maxValue) || maxValue <= 0) {
    return;
  }

  const yAxis = calculateYAxis(maxValue);
  // yAxis.maxをstepの倍数に丸める（Chart.jsが自動で追加ティックを生成しないようにする）
  yAxis.max = Math.ceil(yAxis.max / yAxis.step) * yAxis.step;
  const maxY = yAxis.max * 10000; // 円単位に戻す

  // データを準備（積み上げチャート用に差分を計算）
  const principalData = [];
  const baseTotalData = [];
  const selectedTotalData = [];

  yearlyData.forEach((d) => {
    const principalY = d.principal / 10000; // 万円単位
    const baseTotalY = d.baseTotal / 10000; // 2%の税引後元利合計（万円単位）
    const selectedTotalY = d.selectedTotal / 10000; // 選択利率の税引後元利合計（万円単位）

    principalData.push({ x: d.year, y: principalY });
    // baseTotalはprincipalの上に積み上げるため、差分を計算
    baseTotalData.push({ x: d.year, y: baseTotalY - principalY });
    // selectedTotalはbaseTotalの上に積み上げるため、差分を計算
    selectedTotalData.push({ x: d.year, y: selectedTotalY - baseTotalY });
  });

  // Chart.jsの設定
  const config = {
    type: 'line',
    data: {
      datasets: [
        {
          label: '元本',
          data: principalData,
          backgroundColor: 'transparent', // 画像パターンを使用するため透明に
          borderColor: 'transparent',
          fill: true,
          tension: 0.4,
          stack: 'stack1',
          pointRadius: 0, // データポイントを非表示
          pointHoverRadius: 0,
        },
        {
          label: '利率2%で増えたお金',
          data: baseTotalData, // 2%の税引後元利合計
          backgroundColor: '#D5EFFF', // ブルー
          borderColor: '#D5EFFF',
          fill: true,
          tension: 0.4,
          stack: 'stack1',
          pointRadius: 0, // データポイントを非表示
          pointHoverRadius: 0,
        },
        {
          label: `利率${interestRate}%で増えたお金`,
          data: selectedTotalData, // 選択利率の税引後元利合計
          backgroundColor: '#44AD9D', // グリーン
          borderColor: '#44AD9D',
          fill: true,
          tension: 0.4,
          stack: 'stack1',
          pointRadius: 0, // データポイントを非表示
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      // interestRate、yearlyData、yearsをoptionsに保存してプラグインから参照できるようにする
      interestRate: interestRate,
      yearlyData: yearlyData,
      years: years,
      layout: {
        padding: {
          left: 5, // Y軸ラベルの幅を確保
          top: 30, // Y軸の上部パディング（ティックラベルの上下の余白）
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false, // ツールチップを無効化
        },
      },
      scales: {
        x: {
          stacked: true,
          type: 'linear',
          title: {
            display: false,
          },
          grid: {
            display: false,
          },
          min: 0,
          max: years,
          ticks: {
            stepSize: 5,
            callback: (value) => {
              // 最後のティックに「年」を追加
              if (value === years) {
                return `${value}年`;
              }
              return String(value);
            },
            font: {
              size: 10, // フォントサイズ（調整可能）
            },
          },
          afterBuildTicks: (axis) => {
            // 5刻みでティックを生成
            const ticks = [];
            for (let i = 0; i <= years; i += 5) {
              ticks.push({ value: i });
            }
            // 最後の年が含まれていない場合は追加
            if (ticks.length === 0 || ticks[ticks.length - 1].value !== years) {
              ticks.push({ value: years });
            }
            axis.ticks = ticks;
          },
        },
        y: {
          stacked: true,
          title: {
            display: false,
          },
          beginAtZero: true,
          max: yAxis.max,
          ticks: {
            callback: (value) => {
              return String(value);
            },
            padding: 10, // ティックラベルのパディング（左右の余白）
            font: {
              size: 10, // フォントサイズ（調整可能）
            },
            afterBuildTicks: (axis) => {
              // 指定された刻みでティックを生成
              const ticks = [];
              for (let i = 0; i <= yAxis.max; i += yAxis.step) {
                ticks.push({ value: i });
              }
              axis.ticks = ticks;
            },
          },
          grid: {
            display: false,
          },
        },
      },
      animation: {
        duration: 0, // 全体のアニメーション時間を0に
        x: {
          type: 'number',
          easing: 'linear',
          duration: 300, // 各ポイントのアニメーション時間を短く
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * 50; // 各ポイントの間隔を短く（50ms）
          },
        },
        y: {
          type: 'number',
          easing: 'easeOutQuart', // 滑らかなイージングに変更
          duration: 600, // アニメーション時間を長くして滑らかに
          from: (ctx) => {
            // Y軸の0から開始
            return ctx.chart.scales.y.getPixelForValue(0);
          },
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0;
            }
            ctx.yStarted = true;
            return ctx.index * 50; // 各ポイントの間隔を短く（50ms）
          },
        },
        onComplete: (animation) => {
          // アニメーション完了後に実線を描画
          // animationオブジェクトからchartを取得
          const currentChart = animation.chart;
          if (!currentChart) {
            return;
          }

          // コンテナから直接要素を取得（クロージャーの問題を回避）
          const checkAndDraw = (retryCount = 0) => {
            // チャートから最新のcanvasとcontainerを取得
            const currentCanvas = currentChart.canvas;
            const currentContainer = currentCanvas?.parentElement;

            if (!currentContainer) {
              if (retryCount < 20) {
                requestAnimationFrame(() => {
                  setTimeout(() => checkAndDraw(retryCount + 1), 50);
                });
              }
              return;
            }

            // チャートのoptionsから最新のyearlyData、interestRate、yearsを取得
            const currentYearlyData = currentChart.options.yearlyData;
            const currentInterestRate = currentChart.options.interestRate;
            const currentYears = currentChart.options.years;

            if (!currentYearlyData || !currentInterestRate || !currentYears) {
              return;
            }

            const baseLabel = currentContainer.querySelector('.graph-value-label--base');
            const selectedLabel = currentContainer.querySelector('.graph-value-label--selected');
            const baseAmountElement = baseLabel?.querySelector('.graph-value-label__amount');
            const selectedAmountElement = selectedLabel?.querySelector('.graph-value-label__amount');

            // 要素が存在することを確認
            if (baseAmountElement && selectedAmountElement && currentChart.chartArea) {
              // 必要なデータを取得
              const baseMeta = currentChart.getDatasetMeta(1);
              const selectedMeta = currentChart.getDatasetMeta(2);
              const selectedIndex = Math.min(currentYears, baseMeta.data.length - 1, selectedMeta.data.length - 1);
              const basePoint = baseMeta.data[selectedIndex];
              const selectedPoint = selectedMeta.data[selectedIndex];

              if (basePoint && selectedPoint) {
                const baseY = basePoint.y;
                const selectedY = selectedPoint.y;

                drawConnectingLines(currentChart, currentContainer, currentCanvas, currentYearlyData, currentInterestRate, currentYears, baseLabel, selectedLabel, null, null, baseY, selectedY, selectedIndex, 0, 0);
              }
            } else if (retryCount < 20) {
              // 要素がまだ存在しない場合は再試行（最大20回、約1秒）
              requestAnimationFrame(() => {
                setTimeout(() => checkAndDraw(retryCount + 1), 50);
              });
            }
          };
          requestAnimationFrame(() => {
            setTimeout(() => checkAndDraw(0), 100);
          });
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  // 画像パターンを事前に読み込む（まだ読み込まれていない場合）
  const ctx = canvas.getContext('2d');
  // 画像パス: HTMLファイルからの相対パス（webpackでdist/images/にコピーされる）
  // 複数のパスを試す
  const possiblePaths = ['images/border-bg.webp', './images/border-bg.webp', '/images/border-bg.webp'];

  let imagePattern = null;
  for (const imagePath of possiblePaths) {
    imagePattern = await loadImagePattern(ctx, imagePath);
    if (imagePattern) {
      break;
    }
  }

  // 画像パターンプラグイン
  const imagePatternPlugin = {
    id: 'imagePattern',
    afterDatasetsDraw: (chart) => {
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0); // 元本のメタデータ

      if (meta && meta.data.length > 0 && cachedImagePattern) {
        ctx.save();
        ctx.fillStyle = cachedImagePattern;
        ctx.globalCompositeOperation = 'source-over';

        // 元本エリアを描画
        const points = meta.data;
        if (points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, chart.chartArea.bottom);

          points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });

          const lastPoint = points[points.length - 1];
          ctx.lineTo(lastPoint.x, chart.chartArea.bottom);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    },
  };

  // Y軸ラベルプラグイン（最上部の金額の上に「(万円)」を表示）
  const axisLabelPlugin = {
    id: 'axisLabel',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const yScale = chart.scales.y;

      if (!chartArea || !yScale) {
        return;
      }

      ctx.save();
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#666666';

      // 最上部のティックの位置を取得
      const maxTickValue = yScale.max;
      const maxTickY = yScale.getPixelForValue(maxTickValue);

      // 最上部の金額ラベルの上に「(万円)」を表示（改行のイメージ）
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('(万円)', chartArea.left - 10, maxTickY - 15);

      ctx.restore();
    },
  };

  // 選択年数の値を表示するためのプラグイン（HTML要素として表示、CSSで調整可能）
  const selectedYearValuePlugin = {
    id: 'selectedYearValue',
    afterDraw: (chart) => {
      // チャートのoptionsから最新のinterestRate、yearlyData、yearsを取得（フォールバックなし）
      const currentInterestRate = chart.options.interestRate;
      const currentYearlyData = chart.options.yearlyData;
      const currentYears = chart.options.years;

      // 必須パラメータの検証
      if (!currentInterestRate || !currentYearlyData || !currentYears) {
        return;
      }

      // チャートから最新のcanvasとcontainerを取得
      const currentCanvas = chart.canvas;
      const currentContainer = currentCanvas?.parentElement;

      const chartArea = chart.chartArea;
      const baseMeta = chart.getDatasetMeta(1); // 2%利率のメタデータ
      const selectedMeta = chart.getDatasetMeta(2); // 選択利率のメタデータ

      if (!chartArea || !baseMeta || !selectedMeta || baseMeta.data.length === 0 || !currentContainer) {
        return;
      }

      // 既存の金額表示要素を削除（プラグインが複数回呼ばれる可能性があるため）
      const existingLabels = currentContainer.querySelectorAll('.graph-value-label');
      if (existingLabels.length > 0) {
        existingLabels.forEach((label) => label.remove());
      }
      const existingLines = currentContainer.querySelectorAll('.graph-value-line');
      if (existingLines.length > 0) {
        existingLines.forEach((line) => line.remove());
      }

      // 選択年数のインデックスを取得（yearlyDataは0年目を含むので、currentYearsがそのままインデックス）
      // ただし、Chart.jsのメタデータは実際に描画されるポイントのみを含むため、
      // 最後のデータポイントのインデックスを使用する
      const selectedIndex = Math.min(currentYears, baseMeta.data.length - 1, selectedMeta.data.length - 1);

      if (selectedIndex >= 0 && selectedIndex < baseMeta.data.length && selectedIndex < selectedMeta.data.length) {
        const basePoint = baseMeta.data[selectedIndex];
        const selectedPoint = selectedMeta.data[selectedIndex];

        // yearlyDataのインデックスを計算（yearlyDataは0年目を含むため、最終年のインデックスはcurrentYears）
        // yearlyDataから最終年のデータを取得（yearプロパティで検索）
        let yearlyDataIndex = -1;
        for (let i = currentYearlyData.length - 1; i >= 0; i--) {
          if (currentYearlyData[i] && currentYearlyData[i].year === currentYears) {
            yearlyDataIndex = i;
            break;
          }
        }

        // 見つからない場合は最後の要素を使用
        if (yearlyDataIndex === -1) {
          yearlyDataIndex = currentYearlyData.length - 1;
        }

        // yearlyDataIndexが有効な範囲内か確認
        if (yearlyDataIndex < 0 || yearlyDataIndex >= currentYearlyData.length) {
          return;
        }

        // 最終年のデータが存在するか確認
        const finalYearData = currentYearlyData[yearlyDataIndex];
        if (!finalYearData || finalYearData.year !== currentYears) {
          return;
        }

        if (basePoint && selectedPoint) {
          // 積み上げチャートでは、各ポイントのY座標が積み上げられた位置になる
          // baseTotalDataはprincipalの上に積み上げられるため、basePoint.yはbaseTotalの位置
          const baseY = basePoint.y;
          // selectedTotalDataはbaseTotalの上に積み上げられるため、selectedPoint.yはselectedTotalの位置
          const selectedY = selectedPoint.y;

          // X座標を取得（basePoint.xがNaNの場合はチャートのスケールから取得）
          let graphX = basePoint.x;
          if (isNaN(graphX) || graphX === undefined) {
            // チャートのXスケールから座標を取得
            const xScale = chart.scales.x;
            if (xScale && currentYearlyData[yearlyDataIndex]) {
              // データポイントのyear値からX座標を取得
              const yearValue = currentYearlyData[yearlyDataIndex].year;
              graphX = xScale.getPixelForValue(yearValue);
            } else if (xScale) {
              // year値が取得できない場合は最終年の値から取得
              graphX = xScale.getPixelForValue(currentYears);
            }
          }

          // 座標の検証（NaNチェック）
          if (isNaN(baseY) || isNaN(selectedY) || isNaN(graphX)) {
            return;
          }

          // Canvas要素の位置を取得（コンテナからの相対位置を計算）
          const canvasRect = currentCanvas.getBoundingClientRect();
          const containerRect = currentContainer.getBoundingClientRect();
          const offsetX = canvasRect.left - containerRect.left;
          const offsetY = canvasRect.top - containerRect.top;

          // offsetの検証
          if (isNaN(offsetX) || isNaN(offsetY)) {
            return;
          }

          // 2%利率の税引後元利合計（ブルー）
          const baseValue = currentYearlyData[yearlyDataIndex]?.baseTotal || 0;
          const baseValueFormatted = baseValue.toLocaleString('ja-JP');

          // 金額表示要素を作成（位置は後で設定）
          const baseLabel = document.createElement('div');
          baseLabel.className = 'graph-value-label graph-value-label--base';

          // 説明テキスト要素を作成
          const baseDescription = document.createElement('div');
          baseDescription.className = 'graph-value-label__description graph-value-label__description--base';
          baseDescription.textContent = '利率2%で貯まるお金';
          baseLabel.appendChild(baseDescription);

          // 金額要素を作成
          const baseAmount = document.createElement('div');
          baseAmount.className = 'graph-value-label__amount';
          baseAmount.innerHTML = `${baseValueFormatted}<span class="graph-value-label__unit">円</span>`;
          baseLabel.appendChild(baseAmount);

          currentContainer.appendChild(baseLabel);

          // 実線は.graph-value-label__amountの擬似要素として描画されるため、要素の作成は不要
          // 値の検証（NaNチェック）
          if (isNaN(baseY) || isNaN(selectedY) || isNaN(graphX) || isNaN(offsetX) || isNaN(offsetY) || !chartArea) {
            return;
          }

          // baseLineは使用しないが、connectingLinesDataの互換性のためnullを設定
          const baseLine = null;

          // 座標を設定（CSS変数でオフセット調整可能）
          const containerStyle = getComputedStyle(currentContainer);
          const getOffsetValue = (varName, defaultValue) => {
            const value = containerStyle.getPropertyValue(varName).trim();
            if (!value) return defaultValue;
            // px単位を除去して数値に変換
            const numValue = parseFloat(value.replace('px', ''));
            return isNaN(numValue) ? defaultValue : numValue;
          };

          // ラベルの幅を測定（説明テキストと金額の両方を考慮）
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.font = 'bold 14px sans-serif';
          const baseDescriptionText = '利率2%で貯まるお金';
          const baseDescriptionWidth = tempCtx.measureText(baseDescriptionText).width;
          const baseAmountText = `${baseValueFormatted}円`;
          const baseAmountWidth = tempCtx.measureText(baseAmountText).width;
          const labelWidth = Math.max(baseDescriptionWidth, baseAmountWidth);

          // 金額ラベルをグラフエリアの左側に配置（縦軸と被らないように）
          const labelMargin = 10; // グラフエリアからのマージン
          const labelX = offsetX + chartArea.left + labelMargin;

          // コンテナの高さを取得して、パーセンテージ位置を計算
          const containerHeight = currentContainer.offsetHeight || chart.height;
          const baseLabelYPercent = 35;
          const baseLabelY = (containerHeight * baseLabelYPercent) / 100;

          // 金額ラベルの位置を更新（グラフエリアの左側、35%の位置に固定）
          baseLabel.style.setProperty('--label-y', `${baseLabelYPercent}%`);
          baseLabel.style.setProperty('--label-x', `${labelX}px`);

          // 実線描画はアニメーション完了後に実行

          // 選択利率の税引後元利合計（グリーン）
          const selectedValue = currentYearlyData[yearlyDataIndex]?.selectedTotal || 0;
          const selectedValueFormatted = selectedValue.toLocaleString('ja-JP');

          // 金額表示要素を作成（位置は後で設定）
          const selectedLabel = document.createElement('div');
          selectedLabel.className = 'graph-value-label graph-value-label--selected';

          // 説明テキスト要素を作成
          const selectedDescription = document.createElement('div');
          selectedDescription.className = 'graph-value-label__description graph-value-label__description--selected';
          selectedDescription.textContent = `利率${currentInterestRate}%で貯まるお金`;
          selectedLabel.appendChild(selectedDescription);

          // 金額要素を作成
          const selectedAmount = document.createElement('div');
          selectedAmount.className = 'graph-value-label__amount';
          selectedAmount.innerHTML = `${selectedValueFormatted}<span class="graph-value-label__unit">円</span>`;
          selectedLabel.appendChild(selectedAmount);

          currentContainer.appendChild(selectedLabel);

          // ラベルの幅を測定（説明テキストと金額の両方を考慮）
          const selectedDescriptionText = `利率${currentInterestRate}%で貯まるお金`;
          const selectedDescriptionWidth = tempCtx.measureText(selectedDescriptionText).width;
          const selectedAmountText = `${selectedValueFormatted}円`;
          const selectedAmountWidth = tempCtx.measureText(selectedAmountText).width;
          const selectedLabelWidth = Math.max(selectedDescriptionWidth, selectedAmountWidth);

          // 金額ラベルをグラフエリアの左側に配置（縦軸と被らないように）
          const selectedLabelX = labelX * 1.5;

          // コンテナの高さを取得して、パーセンテージ位置を計算
          const selectedLabelYPercent = 10;
          const selectedLabelY = (containerHeight * selectedLabelYPercent) / 100;

          // 金額ラベルの位置を更新（グラフエリアの左側、10%の位置に固定）
          selectedLabel.style.setProperty('--label-y', `${selectedLabelYPercent}%`);
          selectedLabel.style.setProperty('--label-x', `${selectedLabelX}px`);

          // 実線描画はonCompleteコールバック内で直接要素を取得して実行するため、
          // connectingLinesDataへの保存は不要
        }
      }
    },
  };

  // プラグインを一度だけ登録
  if (!pluginsRegistered) {
    Chart.register(imagePatternPlugin);
    Chart.register(axisLabelPlugin);
    Chart.register(selectedYearValuePlugin);
    pluginsRegistered = true;
  }

  // チャートを作成
  chartInstance = new Chart(canvas, config);
};
