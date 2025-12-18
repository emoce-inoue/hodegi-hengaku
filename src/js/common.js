import { getSimulationData, formatNumber, startCountUpAnimation } from './price.js';
import { drawGraph } from './graph.js';

(() => {
  const SELECTORS = {
    form: '.l-simulation__form',
    resultSection: '#simulation-result',
    period: '#simulation-period',
    amount: '#simulation-amount',
    difference: '#simulation-difference',
    principal: '#simulation-principal',
    graph: '#simulation-graph',
  };

  const initSimulation = () => {
    const form = document.querySelector(SELECTORS.form);
    const resultSection = document.querySelector(SELECTORS.resultSection);

    if (!form || !resultSection) {
      return;
    }

    const elements = {
      period: document.querySelector(SELECTORS.period),
      amount: document.querySelector(SELECTORS.amount),
      difference: document.querySelector(SELECTORS.difference),
      principal: document.querySelector(SELECTORS.principal),
      graph: document.querySelector(SELECTORS.graph),
    };

    resultSection.style.display = 'none';

    const updateSimulationResult = (data, years, monthlyAmount) => {
      const { period, amount, difference, principal } = elements;

      if (period) {
        period.textContent = String(years);
      }

      if (amount) {
        const amountInMan = Number.parseInt(monthlyAmount, 10) / 10000;
        amount.textContent = String(amountInMan);
      }

      if (difference) {
        // 10桁以上の場合にクラスを付与
        const digitCount = String(data.difference).length;
        if (digitCount >= 10) {
          difference.classList.add('l-simulation-result__difference-amount-number--large');
        } else {
          difference.classList.remove('l-simulation-result__difference-amount-number--large');
        }
        // カウントアップアニメーションを開始
        difference.textContent = '0';
        startCountUpAnimation(difference, data.difference, 1500);
      }

      if (principal) {
        // カウントアップアニメーションを開始
        principal.textContent = '0';
        startCountUpAnimation(principal, data.principal, 1500);
      }
    };

    const handleSubmit = (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const monthlyAmount = formData.get('monthly-amount');
      const savingsPeriod = formData.get('savings-period');
      const interestRate = formData.get('interest-rate');

      if (!monthlyAmount || !savingsPeriod || !interestRate) {
        return;
      }

      const data = getSimulationData(Number.parseInt(interestRate, 10), Number.parseInt(monthlyAmount, 10), Number.parseInt(savingsPeriod, 10));

      if (!data) {
        return;
      }

      updateSimulationResult(data, savingsPeriod, monthlyAmount);

      resultSection.style.display = 'block';

      // グラフを描画（表示後に実行）
      if (elements.graph) {
        // 次のフレームで実行して、レイアウトが確定してから描画
        requestAnimationFrame(async () => {
          await drawGraph(elements.graph, Number.parseInt(interestRate, 10), Number.parseInt(monthlyAmount, 10), Number.parseInt(savingsPeriod, 10));
        });
      }

      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    form.addEventListener('submit', handleSubmit);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimulation);
  } else {
    initSimulation();
  }
})();

// ページトップへスムーススクロール
(() => {
  const initPageTop = () => {
    const pageTopButton = document.querySelector('.js-page-top');

    if (!pageTopButton) {
      return;
    }

    pageTopButton.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageTop);
  } else {
    initPageTop();
  }
})();
