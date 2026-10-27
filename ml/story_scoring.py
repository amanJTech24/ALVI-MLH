
def calculate_recall_score(fact_results):
    """
    fact_results: list of boolean values
    produced by the story evaluation step.
    """

    if not fact_results:
        raise ValueError("No facts provided")

    if not all(type(x) is bool for x in fact_results):
        raise ValueError("Fact results must be booleans")

    correct = sum(fact_results)
    total = len(fact_results)

    return {
        "facts_recalled": correct,
        "total_facts": total,
        "recall_score": round(correct / total * 100, 2),
        "clinical_use": False
    }


if __name__ == "__main__":
    # Fictional test: 3 out of 5 facts recalled
    result = calculate_recall_score(
        [True, True, False, True, False]
    )

    print(result)
