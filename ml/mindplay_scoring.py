
import json


def calculate_mindplay_score(
    game_type,
    correct_answers,
    user_answers,
    time_seconds
):
    """
    Calculate scores for ALVI MindPlay games.

    Supported:
    - remember
    - sequence
    - find
    """

    if game_type not in ["remember", "sequence", "find"]:
        raise ValueError("Invalid game type")

    if not isinstance(correct_answers, list):
        raise ValueError("Correct answers must be a list")

    if not isinstance(user_answers, list):
        raise ValueError("User answers must be a list")

    if not correct_answers:
        raise ValueError("No reference answers")

    if not isinstance(time_seconds, (int, float)):
        raise ValueError("Invalid time")

    if not 0 <= time_seconds <= 3600:
        raise ValueError("Invalid completion time")

    # REMEMBER: Correct items selected
    if game_type == "remember":
        if len(set(correct_answers)) != len(correct_answers):
            raise ValueError("Duplicate reference items")
        if len(set(user_answers)) != len(user_answers):
            raise ValueError("Duplicate selections")

        correct = len(
            set(correct_answers) & set(user_answers)
        )

        incorrect = len(
            set(user_answers) - set(correct_answers)
        )

        # Penalize additional wrong selections
        score = max(
            0,
            (correct - incorrect) / len(correct_answers) * 100
        )

    # SEQUENCE: Correct positions
    elif game_type == "sequence":
        correct = sum(
            expected == actual
            for expected, actual in zip(
                correct_answers, user_answers
            )
        )

        incorrect = max(
            len(correct_answers), len(user_answers)
        ) - correct

        score = (
            correct / len(correct_answers) * 100
        )

    # FIND: Correct target selections
    else:
        if len(set(correct_answers)) != len(correct_answers):
            raise ValueError("Duplicate reference targets")
        if len(set(user_answers)) != len(user_answers):
            raise ValueError("Duplicate selections")

        correct = len(
            set(correct_answers) & set(user_answers)
        )

        incorrect = len(
            set(user_answers) - set(correct_answers)
        )

        score = max(
            0,
            (correct - incorrect) / len(correct_answers) * 100
        )

    score = round(min(score, 100), 2)

    return {
        "game": game_type,
        "correct": correct,
        "incorrect": incorrect,
        "score": score,
        "time_seconds": round(time_seconds, 2),
        "clinical_use": False
    }


if __name__ == "__main__":

    # Test Remember
    remember = calculate_mindplay_score(
        "remember",
        ["apple", "book", "key", "chair", "pen"],
        ["apple", "book", "key", "chair", "phone"],
        42
    )

    # Test Sequence
    sequence = calculate_mindplay_score(
        "sequence",
        [1, 3, 2, 4],
        [1, 3, 4, 2],
        25
    )

    # Test Find
    find = calculate_mindplay_score(
        "find",
        ["A1", "B2", "C3", "D4", "E5"],
        ["A1", "B2", "C3", "D4", "E5"],
        18
    )

    print(json.dumps({
        "remember": remember,
        "sequence": sequence,
        "find": find
    }, indent=2))

